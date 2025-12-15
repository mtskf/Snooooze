var snoozedTabs;
var settings;

$(document).ready(function() {
    console.log("options.js initializing...");
    init();
});

async function init() {
    // Fetch data asynchronously
    snoozedTabs = await chrome.runtime.sendMessage({action: "getSnoozedTabs"});
    console.log("snoozedTabs loaded", snoozedTabs);

    settings = await chrome.runtime.sendMessage({action: "getSettings"});
    console.log("settings loaded", settings);

    // Set button click-handlers
    $(".nav-button").click(function(){
        var button = $(this);
        var buttonID = button.attr("id");
        var sectionName = buttonID.slice(0, -7);
        setSection("#" + sectionName);
    });

    setupSnoozedTabs();
    setupSettings();
    setupAbout();

    var startSection = window.location.hash;
    if(!startSection) {
        startSection = "#snoozed-tabs";
    }

    setSection(startSection);

    // Listen to changes to storage (instead of window storage event)
    chrome.storage.onChanged.addListener((changes, area) => {
        if (area === 'local') {
            if (changes.snoozedTabs) {
                snoozedTabs = changes.snoozedTabs.newValue;
                listSnoozedTabs();
                // Also update clear buttons state
                 if ((snoozedTabs["tabCount"] || 0) == 0) {
                    $("#clear-all").prop('disabled', true);
                    $("#export-tabs").prop('disabled', true);
                } else {
                    $("#clear-all").prop('disabled', false);
                    $("#export-tabs").prop('disabled', false);
                }
            }
            if (changes.settings) {
                settings = changes.settings.newValue;
                renderSettings();
            }
        }
    });
}

function setupSnoozedTabs() {
    // List snoozed tabs
    listSnoozedTabs();

    // Set Clear-All and Export Button
    if((snoozedTabs["tabCount"] || 0) == 0) {
        $("#clear-all").prop('disabled', true);
        $("#export-tabs").prop('disabled', true);
    } else {
        $("#clear-all").click(function() {
            clearAll();
        });

        $("#export-tabs").click(function() {
            exportTabs();
        });
    }
}

function setupSettings() {
    $("#reset-settings").click(function() {
        resetSettings();
    });

    $('#start-day-timepicker').timepicker({
        template: false,
        showInputs: false,
        minuteStep: 30,
        defaultTime: settings["start-day"]
    });

    $('#end-day-timepicker').timepicker({
        template: false,
        showInputs: false,
        minuteStep: 30,
        defaultTime: settings["end-day"]
    });

    $('#start-weekend-timepicker').timepicker({
        template: false,
        showInputs: false,
        minuteStep: 30,
        defaultTime: settings["start-weekend"]
    });

    renderSettings();

    $(".bootstrap-timepicker input").on("changeTime.timepicker", function(e) {
        var id = $(this).attr("id");
        var setting = id.substring(0, id.length - 11);
        var time = e.time.value;

        console.log("" + setting + " = " + time);
        settings[setting] = time;
        chrome.runtime.sendMessage({action: "setSettings", data: settings});
    });

    $("select.control").change(function(e){
        var setting = $(this).attr("id");
        var value = parseInt($(this).val());
        console.log("Setting " + setting + " to " + value);

        settings[setting] = value;
        chrome.runtime.sendMessage({action: "setSettings", data: settings});
    });

    $("input[name='badge']").change(function(){
        var badgeVal = $(this).val();
        console.log("Setting badge to " + badgeVal);

        settings["badge"] = badgeVal;
        chrome.runtime.sendMessage({action: "setSettings", data: settings});
        chrome.runtime.sendMessage({action: "updateBadgeText"});
    });

    $("input[name='open-new-tab']").change(function(){
        var openVal = $(this).val();
        console.log("Open in new tab?", openVal);

        settings["open-new-tab"] = openVal;
        chrome.runtime.sendMessage({action: "setSettings", data: settings});
    });
}

function renderSettings() {
    $("#start-day-timepicker").timepicker("setTime", settings["start-day"]);
    $("#end-day-timepicker").timepicker("setTime", settings["end-day"]);
    $("#start-weekend-timepicker").timepicker("setTime", settings["start-weekend"]);

    $("#week-begin").val(settings["week-begin"]);
    $("#weekend-begin").val(settings["weekend-begin"]);
    $("#later-today").val(settings["later-today"]);
    $("#someday").val(settings["someday"]);

    $("input[name='badge']").val([settings["badge"]]);
    chrome.runtime.sendMessage({action: "updateBadgeText"});

    $("input[name='open-new-tab']").val([settings["open-new-tab"]]);
}

function setupAbout() {

}

function setSection(sectionID) {
    var button = $(sectionID + "-button");
    var buttonListItem = button.parent();
    var section = $(sectionID);

    // Set button
    $("#navigation li").removeClass("selected");
    buttonListItem.addClass("selected");

    // Set section
    $(".options-section").hide();
    section.fadeIn();

    // Set page hash
    window.location.hash = sectionID;
}

function listSnoozedTabs() {
    $("#days-list").empty();

    if((snoozedTabs["tabCount"] || 0) == 0) {
        $(".no-tabs").fadeIn();
        return;
    } else {
        $(".no-tabs").hide();
    }

    var popTimes = Object.keys(snoozedTabs).sort();

    for(var i = 0; i < popTimes.length; i++) {
        var popTime = popTimes[i];
        if (popTime === "tabCount") continue;

        var alarmSet = snoozedTabs[popTime];
        if (!alarmSet) continue;

        var day = (new Date(parseInt(popTime)));
        day.setHours(0, 0, 0, 0);

        var dayHeading = $("#day-" + day.getTime());
        if(dayHeading.length == 0) {
            listDay(day);
        }

        for(var j = 0; j < alarmSet.length; j++) {
            var tab = alarmSet[j];
            listTab(tab, day);
        }
    }
}

function listDay(day) {
    var dayLi = $(document.createElement('li'));

    var dayHeading = $(document.createElement('h3'));
    dayHeading.addClass("day-heading");
    dayHeading.text(formatDay(day));

    var dayTabsList = $(document.createElement('ol'));
    dayTabsList.attr("id", "day-" + day.getTime());
    dayTabsList.addClass("day-tabs-list");

    dayLi.append([dayHeading, dayTabsList]);

    $("#days-list").append(dayLi);
}

function listTab(tab, day) {
    console.log("tab", tab);

    var ol = $("#day-" + day.getTime());

    var entry = $(document.createElement('li'))
    entry.addClass("entry");
    entry.attr("url", tab.url);
    entry.attr("creationTime", tab.creationTime);

    var time = $(document.createElement('time'));
    time.addClass("entry-time");
    time.text(formatTime(tab.popTime));

    var favicon = $(document.createElement('span'));
    favicon.addClass("entry-favicon");
    if(tab.favicon) {
        favicon.css("background-image", "url(\"" + tab.favicon +"\")");
    }

    var title = $(document.createElement('a'));
    title.addClass("entry-title");
    var safeUrl = "#";
    try {
        if (/^(https?|ftp|file|chrome-extension):/i.test(tab.url)) {
            safeUrl = tab.url;
        }
    } catch(e) {}
    title.attr("href", safeUrl);
    title.text(tab.title);

    var domain = $(document.createElement('span'));
    domain.addClass("entry-domain");
    var location = document.createElement('a');
    location.href = tab.url;
    domain.text(location.hostname);

    var clear = $(document.createElement('button'));
    clear.addClass("entry-clear custom-appearance");
    clear.attr("title", "Clear Tab");

    clear.click(function(tab, entry) {
        return function() {
            clearEntry(tab, entry);
        }
    }(tab, entry));

    entry.append([time, favicon, title, domain, clear]);

    ol.append(entry);
}

function formatDay(day) {
    // ... Copy formatDay logic ...
    var result = "";
    var tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    if(day.getTime() == tomorrow.getTime()) {
        result += "Tomorrow — ";
    }
    var today = new Date();
    today.setHours(0, 0, 0, 0);
    if(day.getTime() == today.getTime()) {
        result += "Today — ";
    }
    var yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);
    if(day.getTime() == yesterday.getTime()) {
        result += "Yesterday — ";
    }
    var weekdays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    var months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    var weekday = weekdays[day.getDay()];
    var month = months[day.getMonth()];
    result += weekday + ", " + month + " " + day.getDate() + ", " + day.getFullYear();
    return result;
}

function formatTime(popTime) {
    var time = new Date(popTime);
    var hours = time.getHours() % 12;
    var minutes = time.getMinutes();
    if(minutes < 10) { minutes = "0" + minutes; }
    var ampm = (time.getHours() < 12) ? "AM" : "PM";
    return ("" + hours + ":" + minutes + " " + ampm);
}

function clearAll() {
    var tabCount = snoozedTabs["tabCount"];
    if(tabCount <= 0) { return; }

    var confirmText = "Are you sure you want to clear ";
    if(tabCount == 1) { confirmText += "1 tab?"; } else { confirmText += "all " + tabCount + " tabs?"; }
    var canClear = confirm(confirmText);
    if(canClear) {
        chrome.runtime.sendMessage({action: "setSnoozedTabs", data: { tabCount: 0 }});
        chrome.runtime.sendMessage({action: "updateBadgeText"});

        $("#days-list li").fadeOut(function() { $(this).remove(); });
        $("#clear-all").prop('disabled', true);
        $("#export-tabs").prop('disabled', true);
    }
}

function clearEntry(tab, entry) {
    console.log("About to clear tab", tab);

    // Send message to remove
    chrome.runtime.sendMessage({action: "removeSnoozedTab", tab: tab});

    var dayList = entry.parent();
    var dayLi = dayList.parent();

    if(dayList.children().length == 1) {
        dayLi.fadeOut(function() { $(this).remove(); });
    } else {
        entry.fadeOut(function() {
            $(this).slideUp(function() { $(this).remove(); });
        });
    }

    // UI disabling of buttons handled by onChanged listener usually, but can check here for immediate feedback if needed.
    // The onChanged listener will handle consistency.
}

function resetSettings() {
    var canReset = confirm("Are you sure you want to reset all settings?");
    if(!canReset) { return; }

    // Hardcode default settings here since we don't have bg access easily or just send a command?
    // Best to duplicate defaults or ask storage to reset?
    // Sending empty settings might trigger initStorage in background? No.
    // Let's just define defaults here.
    var defaultSettings = {
            "start-day": "9:00 AM",
            "end-day": "6:00 PM",
            "start-weekend": "10:00 AM",
            "week-begin": 1,
            "weekend-begin": 6,
            "later-today": 3,
            "someday": 3,
            "open-new-tab": "true",
            "badge": "true"
        };

    settings = defaultSettings;
    chrome.runtime.sendMessage({action: "setSettings", data: settings});
    renderSettings();
}

function exportTabs() {
    window.URL = window.URL || window.webkitURL;
    var now = new Date();
    dateString = "" + now.getFullYear() + now.getMonth() + now.getDate() + "-" + now.getHours() + now.getMinutes();
    var exportObject = {
        exportTime: now.getTime(),
        settings: settings,
        snoozedTabs: snoozedTabs
    }
    var blob = new Blob([JSON.stringify(exportObject, undefined, 2)], {type: 'text/plain'});
    var blobURL = window.URL.createObjectURL(blob);
    chrome.downloads.download({
        url: blobURL,
        filename: "tabsnooze-" + dateString + ".json",
        saveAs: true
    });
}