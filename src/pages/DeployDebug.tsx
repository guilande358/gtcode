import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Monitor, Smartphone, Wifi, Usb, Play, Square, Upload, Trash2, Clock, XCircle, Sun, Moon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useScrcpySocket, type LogEntry } from '@/hooks/useScrcpySocket';
import { useDebugSessions } from '@/hooks/useDebugSessions';
import { useTheme } from '@/hooks/useTheme';

const SCRCPY_PRESETS = [
  {
    id: 'high-quality',
    label: 'High Quality – Game Testing',
    flags: '--bit-rate=16M --max-fps=60 --window-title="GcodeForce - Game Test"',
  },
  {
    id: 'low-latency',
    label: 'Low Latency – Login Flow Debug',
    flags: '--bit-rate=8M --max-fps=30 --crop=1080:1920:0:0',
  },
  {
    id: 'record',
    label: 'Record Session',
    flags: '--record=test.mp4',
  },
  {
    id: 'custom',
    label: 'Custom Flags',
    flags: '',
  },
] as const;

interface UploadedFile {
  name: string;
  size: number;
}

export default function DeployDebug() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { logs, isConnected, isRunning, connect, sendCommand, interrupt, clearLogs, disconnect } = useScrcpySocket();
  const { sessions, addSession, updateSessionStatus, clearSessions } = useDebugSessions();

  const [connectionType, setConnectionType] = useState<'usb' | 'wireless'>('usb');
  const [deviceIp, setDeviceIp] = useState('192.168.1.100:5555');
  const [selectedPreset, setSelectedPreset] = useState('high-quality');
  const [customFlags, setCustomFlags] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

  const terminalRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll terminal
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [logs]);

  const getFlags = useCallback(() => {
    if (selectedPreset === 'custom') return customFlags;
    return SCRCPY_PRESETS.find(p => p.id === selectedPreset)?.flags || '';
  }, [selectedPreset, customFlags]);

  const handleStart = useCallback(() => {
    if (!isConnected) connect();

    const flags = getFlags();
    const presetLabel = SCRCPY_PRESETS.find(p => p.id === selectedPreset)?.label || 'Custom';

    const sessionId = addSession({
      connectionType,
      ip: connectionType === 'wireless' ? deviceIp : undefined,
      flags,
      preset: presetLabel,
      status: 'running',
    });
    setActiveSessionId(sessionId);

    // Small delay to ensure socket is connected
    setTimeout(() => {
      if (connectionType === 'wireless') {
        sendCommand(`adb connect ${deviceIp}`);
        setTimeout(() => sendCommand(`scrcpy ${flags}`), 1500);
      } else {
        sendCommand(`scrcpy ${flags}`);
      }
    }, isConnected ? 0 : 1000);
  }, [isConnected, connect, getFlags, selectedPreset, connectionType, deviceIp, addSession, sendCommand]);

  const handleStop = useCallback(() => {
    interrupt();
    if (activeSessionId) {
      updateSessionStatus(activeSessionId, 'success');
      setActiveSessionId(null);
    }
  }, [interrupt, activeSessionId, updateSessionStatus]);

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const newFiles: UploadedFile[] = Array.from(files).map(f => ({ name: f.name, size: f.size }));
    setUploadedFiles(prev => [...prev, ...newFiles]);
  }, []);

  const removeFile = useCallback((name: string) => {
    setUploadedFiles(prev => prev.filter(f => f.name !== name));
  }, []);

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const logColor = (entry: LogEntry) => {
    switch (entry.type) {
      case 'stdout': return 'text-green-400';
      case 'stderr': return 'text-red-400';
      case 'command': return 'text-cyan-400 font-bold';
      case 'info': return 'text-yellow-400 italic';
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="h-14 border-b border-border bg-card flex items-center px-4 gap-3">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Back to Studio</TooltipContent>
        </Tooltip>
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
          <span className="text-primary-foreground font-bold text-sm">G</span>
        </div>
        <h1 className="text-lg font-semibold">Deploy & Device Debug</h1>
      </header>

      <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-6">
        {/* Mode Tabs */}
        <Tabs defaultValue="android" className="w-full">
          <TabsList className="grid w-full grid-cols-2 h-auto p-1">
            <TabsTrigger value="browser" className="gap-2 py-3 data-[state=active]:bg-green-600/20 data-[state=active]:text-green-400 data-[state=active]:shadow-[0_0_12px_hsl(142_70%_45%/0.2)]">
              <Monitor className="h-5 w-5" />
              <span className="hidden sm:inline">Browser Preview</span>
              <span className="sm:hidden">Browser</span>
            </TabsTrigger>
            <TabsTrigger value="android" className="gap-2 py-3 data-[state=active]:bg-orange-600/20 data-[state=active]:text-orange-400 data-[state=active]:shadow-[0_0_12px_hsl(25_95%_53%/0.2)]">
              <Smartphone className="h-5 w-5" />
              <span className="hidden sm:inline">Android Device (Scrcpy)</span>
              <span className="sm:hidden">Android</span>
            </TabsTrigger>
          </TabsList>

          {/* Browser Preview Tab */}
          <TabsContent value="browser">
            <Card className="border-green-500/20 shadow-[0_0_20px_hsl(142_70%_45%/0.05)]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Monitor className="h-5 w-5 text-green-400" />
                  Browser Preview
                </CardTitle>
                <CardDescription>
                  Run your game directly in the browser. Uses the built-in Three.js canvas from the Studio editor.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={() => navigate('/')}
                  className="bg-green-600 hover:bg-green-700 text-white gap-2 shadow-[0_0_12px_hsl(142_70%_45%/0.3)]"
                >
                  <Play className="h-4 w-4" />
                  Run in Browser
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Android Device Tab */}
          <TabsContent value="android" className="space-y-4">
            <div className="grid gap-4 lg:grid-cols-2">
              {/* Left: Controls */}
              <div className="space-y-4">
                {/* Connection Type */}
                <Card className="border-orange-500/20">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Smartphone className="h-4 w-4 text-orange-400" />
                      Connection
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <RadioGroup value={connectionType} onValueChange={(v) => setConnectionType(v as 'usb' | 'wireless')}>
                      <div className="flex items-center space-x-2 p-3 rounded-lg border border-border hover:border-orange-500/30 transition-colors">
                        <RadioGroupItem value="usb" id="usb" />
                        <Label htmlFor="usb" className="flex items-center gap-2 cursor-pointer flex-1">
                          <Usb className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="font-medium">USB (Cable)</p>
                            <p className="text-xs text-muted-foreground">Device connected & authorized via ADB</p>
                          </div>
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2 p-3 rounded-lg border border-border hover:border-orange-500/30 transition-colors">
                        <RadioGroupItem value="wireless" id="wireless" />
                        <Label htmlFor="wireless" className="flex items-center gap-2 cursor-pointer flex-1">
                          <Wifi className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="font-medium">Wireless (Wi-Fi ADB)</p>
                            <p className="text-xs text-muted-foreground">Connect over local network</p>
                          </div>
                        </Label>
                      </div>
                    </RadioGroup>

                    {connectionType === 'wireless' && (
                      <div className="space-y-2 pl-8">
                        <Label htmlFor="device-ip" className="text-sm">Device IP:Port</Label>
                        <Input
                          id="device-ip"
                          value={deviceIp}
                          onChange={e => setDeviceIp(e.target.value)}
                          placeholder="192.168.1.100:5555"
                          className="font-mono text-sm"
                        />
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Presets */}
                <Card className="border-orange-500/20">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Scrcpy Preset</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <RadioGroup value={selectedPreset} onValueChange={setSelectedPreset} className="space-y-2">
                      {SCRCPY_PRESETS.map(preset => (
                        <div
                          key={preset.id}
                          className="flex items-start space-x-2 p-3 rounded-lg border border-border hover:border-orange-500/30 transition-colors"
                        >
                          <RadioGroupItem value={preset.id} id={preset.id} className="mt-0.5" />
                          <Label htmlFor={preset.id} className="cursor-pointer flex-1">
                            <p className="font-medium text-sm">{preset.label}</p>
                            {preset.flags && (
                              <p className="text-xs text-muted-foreground font-mono mt-1">{preset.flags}</p>
                            )}
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>

                    {selectedPreset === 'custom' && (
                      <div className="mt-3 space-y-2">
                        <Label className="text-sm">Custom Flags</Label>
                        <Input
                          value={customFlags}
                          onChange={e => setCustomFlags(e.target.value)}
                          placeholder="--bit-rate=12M --max-fps=45"
                          className="font-mono text-sm"
                        />
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  {!isRunning ? (
                    <Button
                      onClick={handleStart}
                      className="flex-1 bg-orange-600 hover:bg-orange-700 text-white gap-2 shadow-[0_0_12px_hsl(25_95%_53%/0.3)]"
                    >
                      <Play className="h-4 w-4" />
                      Start Scrcpy Mirror & Control
                    </Button>
                  ) : (
                    <Button
                      onClick={handleStop}
                      variant="destructive"
                      className="flex-1 gap-2"
                    >
                      <Square className="h-4 w-4" />
                      Stop (Ctrl+C)
                    </Button>
                  )}
                </div>

                {isRunning && (
                  <Card className="border-green-500/30 bg-green-500/5">
                    <CardContent className="p-4 text-sm text-green-400">
                      <p className="font-medium">✅ Scrcpy session started on server</p>
                      <p className="text-xs mt-1 text-muted-foreground">
                        The device screen should appear in a window on the server machine.
                        Use mouse/keyboard to interact. Test logins, touches, accounts on the real device now.
                      </p>
                    </CardContent>
                  </Card>
                )}

                {/* File Upload */}
                <Card className="border-border">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Upload className="h-4 w-4 text-muted-foreground" />
                      Upload Scrcpy Binaries
                      <span className="text-xs text-muted-foreground font-normal">(optional)</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div
                      className="border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:border-orange-500/40 transition-colors"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">
                        Click to upload scrcpy, adb, libusb binaries
                      </p>
                      <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        className="hidden"
                        onChange={handleFileUpload}
                        accept=".exe,.dll,.so,.dylib"
                      />
                    </div>

                    {uploadedFiles.length > 0 && (
                      <div className="space-y-1">
                        {uploadedFiles.map(f => (
                          <div key={f.name} className="flex items-center justify-between px-3 py-2 rounded bg-secondary text-sm">
                            <span className="font-mono truncate">{f.name}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground">{formatBytes(f.size)}</span>
                              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeFile(f.name)}>
                                <XCircle className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Right: Terminal + History */}
              <div className="space-y-4">
                {/* Terminal */}
                <Card className="border-border">
                  <CardHeader className="pb-2 flex flex-row items-center justify-between">
                    <CardTitle className="text-base">Terminal Output</CardTitle>
                    <div className="flex items-center gap-2">
                      <div className={`h-2 w-2 rounded-full ${isConnected ? 'bg-green-500 shadow-[0_0_6px_hsl(142_70%_45%/0.5)]' : 'bg-muted-foreground'}`} />
                      <span className="text-xs text-muted-foreground">{isConnected ? 'Connected' : 'Disconnected'}</span>
                      <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={clearLogs}>
                        Clear
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div
                      ref={terminalRef}
                      className="bg-[hsl(var(--background))] border border-border rounded-lg p-3 h-[350px] md:h-[450px] overflow-y-auto font-mono text-xs leading-relaxed"
                    >
                      {logs.length === 0 ? (
                        <p className="text-muted-foreground italic">Waiting for commands...</p>
                      ) : (
                        logs.map((entry, i) => (
                          <div key={i} className={logColor(entry)}>
                            <span className="text-muted-foreground/50 mr-2">
                              {entry.timestamp.toLocaleTimeString()}
                            </span>
                            {entry.text}
                          </div>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Session History */}
                <Card className="border-border">
                  <CardHeader className="pb-2 flex flex-row items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      Recent Sessions
                    </CardTitle>
                    {sessions.length > 0 && (
                      <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={clearSessions}>
                        <Trash2 className="h-3 w-3 mr-1" />
                        Clear
                      </Button>
                    )}
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[180px]">
                      {sessions.length === 0 ? (
                        <p className="text-sm text-muted-foreground italic">No sessions yet</p>
                      ) : (
                        <div className="space-y-2">
                          {sessions.map(s => (
                            <div key={s.id} className="flex items-center justify-between p-2 rounded border border-border text-xs">
                              <div className="space-y-0.5 min-w-0">
                                <p className="font-medium truncate">{s.preset}</p>
                                <p className="text-muted-foreground">
                                  {s.connectionType === 'wireless' ? `Wi-Fi: ${s.ip}` : 'USB'} •{' '}
                                  {new Date(s.date).toLocaleString()}
                                </p>
                              </div>
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                                s.status === 'success' ? 'bg-green-500/20 text-green-400' :
                                s.status === 'fail' ? 'bg-red-500/20 text-red-400' :
                                'bg-yellow-500/20 text-yellow-400'
                              }`}>
                                {s.status}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </ScrollArea>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
