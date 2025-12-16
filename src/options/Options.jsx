import React, { useState, useEffect } from 'react';
import logo from '../assets/logo.svg';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getSettings } from '@/utils/timeUtils';
import { Trash2, ExternalLink, AppWindow, Download, Upload, Check, ChevronsUpDown, Inbox, Settings } from 'lucide-react';
import { cn } from "@/lib/utils";

export default function Options() {
    const [snoozedTabs, setSnoozedTabs] = useState({});
    const [settings, setSettings] = useState({});
    const [activeTab, setActiveTab] = useState(() => {
        // Check URL hash for initial tab
        const hash = window.location.hash.slice(1);
        return hash === 'settings' ? 'settings' : 'snoozed-tabs';
    });

    const fileInputRef = React.useRef(null);

    useEffect(() => {
        // Initial load using helper to ensure defaults (like timezone) are merged
        getSettings().then((mergedSettings) => {
            setSettings(mergedSettings);
            // If timezone was missing and added by default, we might (optionally) want to persist it,
            // but for now local state is sufficient as it will be saved on any change.
        });

        chrome.storage.local.get(["snoozedTabs"], (res) => {
            if (res.snoozedTabs) setSnoozedTabs(res.snoozedTabs);
        });

        // Listen for changes
        const listener = (changes, area) => {
            if (area === 'local') {
                if (changes.snoozedTabs) setSnoozedTabs(changes.snoozedTabs.newValue || {});
                // For settings, we might want to re-merge if partial?
                // But usually changes.settings.newValue is the full object from set() actions.
                if (changes.settings) setSettings(changes.settings.newValue || {});
            }
        };
        chrome.storage.onChanged.addListener(listener);
        return () => chrome.storage.onChanged.removeListener(listener);

    }, []);

    const updateSetting = (key, value) => {
        const newSettings = { ...settings, [key]: value };
        setSettings(newSettings);
        chrome.storage.local.set({ settings: newSettings });
        // Trigger badge update
        chrome.runtime.sendMessage({ action: "updateBadgeText" });
    };

    const clearTab = (tab) => {
        chrome.runtime.sendMessage({ action: "removeSnoozedTab", tab: tab });
    };

    const clearAll = () => {
        if (confirm("Are you sure you want to clear all snoozed tabs?")) {
             chrome.runtime.sendMessage({ action: "clearAllSnoozedTabs" });
        }
    };

    // Export snoozed tabs to OneTab format
    const handleExport = () => {
        const lines = [];
        Object.keys(snoozedTabs).forEach(ts => {
            if (ts === 'tabCount') return;
            const tabs = snoozedTabs[ts];
            if (!tabs || tabs.length === 0) return;
            tabs.forEach(tab => {
                lines.push(`${tab.url} | ${tab.title || 'Untitled'}`);
            });
        });



        if (lines.length === 0) {
            alert("No tabs to export.");
            return;
        }

        const content = lines.join('\n');
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `snooooze-export-${new Date().toISOString().split('T')[0]}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    // Import from OneTab format
    const handleImport = (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const content = e.target.result;
            const lines = content.split('\n').filter(line => line.trim());

            // Parse lines and create tab entries
            const newTabs = lines.map(line => {
                const [url, ...titleParts] = line.split(' | ');
                return {
                    url: url.trim(),
                    title: titleParts.join(' | ').trim() || 'Imported Tab',
                    creationTime: Date.now()
                };
            }).filter(tab => tab.url);

            if (newTabs.length === 0) {
                alert('No valid tabs found in file.');
                return;
            }

            // Add to storage with "Someday" timestamp (1 year from now)
            const somedayTime = Date.now() + (365 * 24 * 60 * 60 * 1000);

            chrome.storage.local.get("snoozedTabs", (res) => {
                const tabs = res.snoozedTabs || { tabCount: 0 };

                if (!tabs[somedayTime]) {
                    tabs[somedayTime] = [];
                }
                tabs[somedayTime].push(...newTabs);
                tabs.tabCount = (tabs.tabCount || 0) + newTabs.length;

                chrome.storage.local.set({ snoozedTabs: tabs }, () => {
                    alert(`Imported ${newTabs.length} tabs successfully!`);
                });
            });
        };
        reader.readAsText(file);
        event.target.value = ''; // Reset file input
    };

    // Helper to list tabs
    const renderSnoozedList = () => {
        const timestamps = Object.keys(snoozedTabs).sort();
        const days = [];

        timestamps.forEach(ts => {
            if (ts === 'tabCount') return;
            const tabs = snoozedTabs[ts];
            if (!tabs || tabs.length === 0) return;

            const date = new Date(parseInt(ts));
            const dayKey = date.toDateString();

            let dayGroup = days.find(d => d.key === dayKey);
            if (!dayGroup) {
                dayGroup = { key: dayKey, date: date, items: [] };
                days.push(dayGroup);
            }

            tabs.forEach(tab => {
                dayGroup.items.push({ ...tab, popTime: parseInt(ts) });
            });
        });

        if (days.length === 0) {
            return <div className="text-center p-8 text-muted-foreground">No snoozed tabs.</div>;
        }

        return days.map(day => (
            <div key={day.key} className="mb-6">
                <h3 className="text-sm font-medium mb-2 ml-1 text-muted-foreground">{formatDay(day.date)}</h3>
                <div className="grid gap-2">
                    {day.items.map((tab, idx) => (
                        <Card key={`${tab.url}-${tab.creationTime}-${idx}`} className="flex flex-row items-center p-3 justify-between">
                             <div className="flex items-center gap-3 overflow-hidden">
                                {tab.favicon && <img src={tab.favicon} className="w-4 h-4" alt="" />}
                                <div className="flex flex-col overflow-hidden">
                                    <a href={tab.url} target="_blank" rel="noreferrer" className="text-sm font-medium truncate hover:underline block max-w-[400px]">
                                        {tab.title}
                                    </a>
                                    <span className="text-xs text-muted-foreground flex gap-2">
                                        <span>{tab.url ? new URL(tab.url).hostname : 'Unknown'}</span>
                                        <span>•</span>
                                        <span>{formatTime(tab.popTime)}</span>
                                    </span>
                                </div>
                             </div>
                             <Button variant="ghost" size="icon" onClick={() => clearTab(tab)}>
                                 <Trash2 className="h-4 w-4" />
                             </Button>
                        </Card>
                    ))}
                </div>
            </div>
        ));
    };



    return (
        <div className="container max-w-3xl py-8">
            <img src={logo} alt="Snooze" className="h-8 mb-6" />

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="mb-4">
                    <TabsTrigger value="snoozed-tabs">
                        <Inbox className="h-4 w-4 mr-2" />
                        Snoozed
                    </TabsTrigger>
                    <TabsTrigger value="settings">
                        <Settings className="h-4 w-4 mr-2" />
                        Settings
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="snoozed-tabs">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle>Snoozed</CardTitle>

                            </div>
                            <div className="flex gap-2">
                                <Button variant="secondary" size="xs" onClick={handleExport}>
                                    <Download className="h-3 w-3 mr-1" />
                                    Export
                                </Button>
                                <Button variant="secondary" size="xs" onClick={() => fileInputRef.current?.click()}>
                                    <Upload className="h-3 w-3 mr-1" />
                                    Import
                                </Button>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleImport}
                                    accept=".txt"
                                    className="hidden"
                                />
                                {(snoozedTabs.tabCount > 0) && (
                                    <Button variant="destructive" size="xs" onClick={clearAll}>
                                        <Trash2 className="mr-1 h-3 w-3" />
                                        Delete All
                                    </Button>
                                )}
                            </div>
                        </CardHeader>

                        <CardContent>
                            {renderSnoozedList()}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="settings" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Preferences</CardTitle>

                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-1 sm:grid-cols-10 gap-3">
                                <div className="space-y-2 sm:col-span-3">
                                    <label className="text-[10px] font-medium">Start Day (Morning)</label>
                                    <Select
                                        value={settings['start-day'] || '9:00 AM'}
                                        onValueChange={(value) => updateSetting('start-day', value)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {['5:00 AM', '6:00 AM', '7:00 AM', '8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM'].map((time) => (
                                                <SelectItem key={time} value={time}>{time}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2 sm:col-span-3">
                                    <label className="text-[10px] font-medium">End Day (Evening)</label>
                                    <Select
                                        value={settings['end-day'] || '6:00 PM'}
                                        onValueChange={(value) => updateSetting('end-day', value)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {['4:00 PM', '5:00 PM', '6:00 PM', '7:00 PM', '8:00 PM', '9:00 PM', '10:00 PM', '11:00 PM'].map((time) => (
                                                <SelectItem key={time} value={time}>{time}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2 sm:col-span-4">
                                    <label className="text-[10px] font-medium">Timezone</label>
                                    <TimezoneSelect
                                        value={settings['timezone']}
                                        onValueChange={(value) => updateSetting('timezone', value)}
                                    />
                                </div>
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <label className="text-sm font-medium">Open in New Tab</label>
                                    <p className="text-xs text-muted-foreground">Open snoozed tabs in a new tab instead of window.</p>
                                </div>
                                <Switch
                                    checked={settings['open-new-tab'] === 'true'}
                                    onCheckedChange={(c) => updateSetting('open-new-tab', c ? 'true' : 'false')}
                                />
                            </div>
                        </CardContent>
                    </Card>


                </TabsContent>
            </Tabs>
        </div>
    );
}

function formatDay(date) {
    // Simple formatter
    return date.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
}

function formatTime(timestamp) {
    return new Date(timestamp).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}
