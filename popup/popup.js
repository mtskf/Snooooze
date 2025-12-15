$(document).ready(function() {
    console.log("popup.js initializing...");
    init();
});

async function init() {
    // Get snoozed tabs via message
    const snoozedTabs = await chrome.runtime.sendMessage({action: "getSnoozedTabs"});
    console.log("Snoozed tabs:", snoozedTabs);

    var tabCount = snoozedTabs["tabCount"] || 0;
    if (tabCount > 0) {
        var button = $(document.createElement('button'));
        button.click(function() {
            console.log("status button clicked");
            window.open(chrome.runtime.getURL("options/index.html#snoozed-tabs"));
        });

        $("#default-status").html(button);
        updateStatusText(snoozedTabs);
    }

    // Set up button click-handlers
    $("#snooze-buttons button").click(function() {
        var timeName = $(this).attr("id");
        console.log("button-clicked", timeName);

        if (timeName == "pick-date") {
            $("#datepicker").slideDown({
                duration: 500,
                easing: "easeInOutBack"
            });
        } else {
            handleSnoozeClick($(this).attr("id"));
        }
    });

    $("#settings").click(function() {
        console.log("options clicked");
        window.open(chrome.runtime.getURL("options/index.html#settings"));
    });

    // Set up datepicker
    $("#datepicker").datepicker({
        showOtherMonths: true,
        selectOtherMonths: true,
        showButtonPanel: true,
        onSelect: function(dateText) {
             // Handle date selection if needed, or just let users click a button after selection?
             // Original logic seemed to rely on a separate button or maybe implementation detail hidden.
             // Original code didn't look like it had a confirm button for datepicker, just 'pick-date' expanded it.
             // Wait, where is the logic for datepicker selection?
             // Original code Step 16: `snoozeCurrentTab(time)` was called for buttons.
             // For pick-date, it just expanded.
             // But how does one actually submit the date in the original?
             // It seems missing from the original snippet `popup.js` around line 50.
             // Ah, maybe usage of datepicker adds events?
             // Or maybe I missed it. I'll stick to reproducing what was there logic-wise or improving if broken.
             // Original `getTime` handled `pick-date` by returning undefined.
             // I will implement date picking logic properly if I can or leave as is if user didn't ask to fix features.
             // "fix code that doesn't work in latest chrome".
             // I will assume the original logic for datepicker interaction is outside the provided lines or standard jQuery UI flow?
             // Actually, usually you need an 'onSelect' or a button.
             // I'll leave as is for now to avoid scope creep, just fixing V3 migration.
        }
    });

    // Set up listener for keyboard shortcuts
    setupKeyboardCommands();

    // Set up listener for when snoozedTabs changes
    chrome.storage.onChanged.addListener((changes, area) => {
        if (area === 'local' && changes.snoozedTabs) {
            updateStatusText(changes.snoozedTabs.newValue);
        }
    });

    // Update badge text (optional, usually background handles it, but good to trigger check)
    chrome.runtime.sendMessage({action: "updateBadgeText"});
}

async function handleSnoozeClick(timeName) {
    const time = await getTime(timeName);
    snoozeCurrentTab(time);
}

function updateStatusText(snoozedTabs) {
    var tabCount = snoozedTabs["tabCount"] || 0;

    if (tabCount > 0) {
        var buttonText = "" + tabCount + " Snoozed Tab";
        if (tabCount > 1) {
            buttonText += "s";
        }
        var button = $("#default-status button");
        if (button.length === 0) {
           // Re-create button (copy logic from init due to async load?)
           // For simplicity, just update text if exists, or simple refresh logic.
           // Original logic was dynamic html replacement.
           button = $(document.createElement('button'));
            button.click(function() {
                window.open(chrome.runtime.getURL("options/index.html#snoozed-tabs"));
            });
           $("#default-status").html(button);
        }

        $("#default-status button").text(buttonText);
    } else {
        $("#default-status").html("Tab Snooze");
    }
}

function snoozeCurrentTab(time) {
    if (!time) {
        return;
    }

    chrome.tabs.query({
        currentWindow: true,
        active: true
    }, function(tabs) {
        console.log("tabs: ", tabs);
        // Clean tab object to send only necessary data (V3 message passing serialization)
        const tabToSend = {
            id: tabs[0].id,
            url: tabs[0].url,
            title: tabs[0].title,
            favIconUrl: tabs[0].favIconUrl
        };

        chrome.runtime.sendMessage({
            action: "snooze",
            tab: tabToSend,
            popTime: time.getTime() // Send timestamp
        }, (response) => {
             if (response && response.success) {
                 window.close(); // Close popup on success
             }
        });
    });
}

// Logic to calculate time
async function getTime(timeName) {
    console.log("timeName", timeName);

    const settings = await chrome.runtime.sendMessage({action: "getSettings"});

    // Get rounded time
    var roundedNow = new Date();
    roundedNow.setSeconds(0, 0); // Round date to minutes

    var second = 1000;
    var minute = second * 60;
    var hour = minute * 60;
    var day = hour * 24;

    var result = new Date();
    setSettingsTime(result, settings["start-day"]); // Default for most cases

    // Calculate wake-up time
    switch(timeName) {
    case "later-today":
            result = new Date(roundedNow.getTime() + parseInt(settings["later-today"]) * hour);
            break;
        case "this-evening":
        if(result.getHours() > getSettingsTime(settings["end-day"])) {
            result.setDate(result.getDate() + 1);
        }
            setSettingsTime(result, settings["end-day"]);
            break;
        case "tomorrow-evening":
        if(result.getHours() > 5) {
            result.setDate(result.getDate() + 1);
        }
            setSettingsTime(result, settings["end-day"]);
            break;
    case "2-days-evening":
        if(result.getHours() > 5) {
            result.setDate(result.getDate() + 2);
        } else {
            result.setDate(result.getDate() + 1);
        }
            setSettingsTime(result, settings["end-day"]);
            break;
        case "tomorrow":
        if(result.getHours() > 5) {
            result.setDate(result.getDate() + 1); // Automatically updates months
        } else {
            result.setDate(result.getDate());
        }
        break;
    case "2-days-morning":
        if(result.getHours() > 5) {
            result.setDate(result.getDate() + 2);
        } else {
            result.setDate(result.getDate() + 1);
        }
        break;
        case "this-weekend":
            var daysToWeekend = daysToNextDay(result.getDay(), settings["weekend-begin"])
            result.setDate(result.getDate() + daysToWeekend);
            break;
        case "next-week":
            console.log("calculating next-week");
            var daysToWeek = daysToNextDay(result.getDay(), settings["week-begin"]);
            result.setDate(result.getDate() + daysToWeek);
            break;
        case "in-a-week":
            result.setDate(result.getDate() + 7);
            break;
        case "in-a-month":
            result.setMonth(result.getMonth() + 1);
            break;
        case "someday":
            result.setMonth(result.getMonth() + settings["someday"]);
            break;
        case "pick-date":
            // For now undefined, as per original.
            result = undefined;
            break;
        default:
            result = new Date();
    }

    console.log("result", result);
    return result;
}

function daysToNextDay(currentDay, nextDay) {
    if(currentDay > 6 || currentDay < 0 || nextDay > 6 || nextDay < 0) {
        return;
    }

    if(nextDay <= currentDay) {
        return (7 + nextDay) - currentDay;
    } else {
        return nextDay - currentDay;
    }
}

function getSettingsTime(settingsTime) {
    var timeParts = settingsTime.split(/[\s:]+/);
    var hour = parseInt(timeParts[0]);
    var meridian = timeParts[2];

    if(meridian == "AM" && hour == 12) {
        hour = 0;
    }

    if(meridian == "PM" && hour < 12) {
        hour = hour + 12;
    }

    return hour;
}

function setSettingsTime(result, settingsTime) {
    var hour = getSettingsTime(settingsTime);
    var timeParts = settingsTime.split(/[\s:]+/);
    var minute = parseInt(timeParts[1]);
    result.setHours(hour, minute, 0, 0);

    return result;
}

function setupKeyboardCommands() {
    var buttons = $("#snooze-buttons button");
    $(window).bind("keypress", function(e) {
        // ... (Original Keypress Logic)
        // Since I'm essentially rewriting, I'll copy the switch case.
        var code = (e.keyCode ? e.keyCode : e.which);
        switch(code) {
            case 49: buttons[0].click(); break;
            case 50: buttons[1].click(); break;
            case 51: buttons[2].click(); break;
            case 113: buttons[3].click(); break;
            case 119: buttons[4].click(); break;
            case 101: buttons[5].click(); break;
            case 97: buttons[6].click(); break;
            case 115: buttons[7].click(); break;
            case 100: buttons[8].click(); break;
            case 120: buttons[9].click(); break;
            case 122: buttons[10].click(); break;
            case 99: buttons[11].click(); break;
            default: console.log(e.keyCode); break;
        }
    });
}
