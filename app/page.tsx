"use client"
import type React from "react"
import { Heart, Upload, Download, Copy, RefreshCw, Send, Zap, Wifi, Monitor } from "lucide-react"
import { useState, useRef, ChangeEvent } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"

// Interface for file upload response
interface UploadSuccessResponse {
  message: string;
  archiveName: string;
  shareCode: string;
  filesCount: number;
  fileNames: string[];
}

export default function RetroFileShare() {
  // Upload functionality states
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState<boolean>(false);
  const [shareCode, setShareCode] = useState<string>('');
  const [uploadError, setUploadError] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  
  // Download functionality states
  const [inputCode, setInputCode] = useState<string>('');
  const [downloading, setDownloading] = useState<boolean>(false);
  const [downloadError, setDownloadError] = useState<string>('');
  const [downloadMessage, setDownloadMessage] = useState<string>('');

  // Network Share UI states (no functionality)
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [discoveredDevices, setDiscoveredDevices] = useState<Array<{id: string, name: string, type: string, isLocal: boolean}>>([]);
  const [selectedPeer, setSelectedPeer] = useState<{id: string, name: string, localIpHint?: string} | null>(null);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [transferProgress, setTransferProgress] = useState<number>(0);
  const [transferError, setTransferError] = useState<string>('');
  const [networkSelectedFiles, setNetworkSelectedFiles] = useState<File[]>([]);
  const [manualIP, setManualIP] = useState<string>('');
  const [chatMessage, setChatMessage] = useState<string>('');
  const [chatMessages, setChatMessages] = useState<Array<{message: string, sent: boolean}>>([]);
  const networkFileInputRef = useRef<HTMLInputElement>(null);

  // File selection handler
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      setSelectedFiles(Array.from(files));
      setShareCode(''); // Clear previous code
      setUploadError('');
    } else {
      setSelectedFiles([]);
    }
  }

  // Network file selection handler
  const handleNetworkFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      setNetworkSelectedFiles(Array.from(files));
    }
  };

  // Drag and drop handlers
  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };
  
  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };
  
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };
  
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      setSelectedFiles(Array.from(files));
      setShareCode(''); // Clear previous code
      setUploadError('');
    }
  };

  // File upload handler
  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      setUploadError('Please select at least one file to upload.');
      return;
    }

    setUploading(true);
    setUploadError('');
    setShareCode('');

    try {
      const formData = new FormData();
      selectedFiles.forEach((file) => {
        formData.append('files', file);
      });

      console.log(`Sending ${selectedFiles.length} file(s) for compression and upload...`);

      const response = await fetch('/api/s3-compress-and-upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Server response error:', errorData);
        throw new Error(errorData.message || 'Failed to upload and compress files.');
      }

      const result: UploadSuccessResponse = await response.json();
      console.log('Backend response:', result);

      setShareCode(result.shareCode);
      setSelectedFiles([]); // Clear selected files

    } catch (err: any) {
      console.error('Upload process failed:', err);
      setUploadError(err.message || 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  // File download handler
  const handleDownload = async () => {
    if (inputCode.length !== 6) {
      setDownloadError('Please enter a valid 6-character share code.');
      return;
    }

    setDownloading(true);
    setDownloadError('');
    setDownloadMessage('');

    try {
      const response = await fetch('/api/resolve-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ shareCode: inputCode }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to resolve share code.');
      }

      const result = await response.json();
      console.log('Download response:', result);

      // Create a temporary link to download the file
      const link = document.createElement('a');
      link.href = result.downloadUrl;
      link.download = result.archiveName || 'downloaded-files.zip';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setDownloadMessage(`Files downloaded successfully! Archive: ${result.archiveName}`);
      setInputCode(''); // Clear the input

    } catch (err: any) {
      console.error('Download process failed:', err);
      setDownloadError(err.message || 'Download failed. Please check the share code and try again.');
    } finally {
      setDownloading(false);
    }
  };

  // Copy to clipboard handler
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(err => console.error('Failed to copy:', err));
  };

  // Mock network functions (UI only)
  const scanNetwork = () => {
    setIsScanning(true);
    setTimeout(() => {
      setDiscoveredDevices([
        { id: '1', name: 'Desktop-PC', type: 'desktop', isLocal: true },
        { id: '2', name: 'iPhone-12', type: 'mobile', isLocal: true },
        { id: '3', name: 'Laptop-Mac', type: 'desktop', isLocal: false }
      ]);
      setIsScanning(false);
    }, 2000);
  };

  const connectToPeer = (device: {id: string, name: string, type: string, isLocal: boolean}) => {
    setSelectedPeer({ id: device.id, name: device.name, localIpHint: device.isLocal ? '192.168.1.100' : undefined });
    setIsConnecting(true);
    setTimeout(() => {
      setIsConnecting(false);
      setIsConnected(true);
      setTransferError('');
    }, 1500);
  };

  const handleManualConnect = () => {
    if (!manualIP) return;
    const device = { id: 'manual', name: `Manual Device (${manualIP})`, localIpHint: manualIP };
    setSelectedPeer(device);
    setIsConnecting(true);
    setTimeout(() => {
      setIsConnecting(false);
      setIsConnected(true);
      setTransferError('');
    }, 1500);
  };

  const handleP2PTransfer = () => {
    if (networkSelectedFiles.length > 0 && isConnected) {
      setTransferProgress(0);
      const interval = setInterval(() => {
        setTransferProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            return 100;
          }
          return prev + 10;
        });
      }, 200);
    }
  };

  const handleSendMessage = () => {
    if (chatMessage.trim() && isConnected) {
      setChatMessages(prev => [...prev, { message: chatMessage, sent: true }]);
      setChatMessage('');
      // Simulate received message
      setTimeout(() => {
        setChatMessages(prev => [...prev, { message: 'Message received!', sent: false }]);
      }, 1000);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 md:p-4">
      <div className="container mx-auto max-w-full p-2 md:max-w-4xl bg-gray-800/80 rounded-lg shadow-lg shadow-gray-900/20 backdrop-blur-md border border-cyan-400">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-cyan-400 to-purple-500 rounded-lg flex items-center justify-center">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl md:text-4xl font-bold bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              RetroShare
            </h1>
          </div>
          <p className="text-cyan-300 text-lg font-head">{"> Instant file transfer across dimensions <"}</p>
        </div>

        {/* Main Interface */}
        <Card className="bg-gray-900/80 border-2 border-cyan-400 shadow-2xl shadow-cyan-400/20">
          <CardHeader className="bg-gradient-to-r from-purple-800/50 to-blue-800/50 border-b border-cyan-400 p-2 md:p-4">
            <CardTitle className="text-cyan-300 font-head text-sm md:text-xl flex items-center gap-2">
              <Monitor className="w-7 h-7" />
              Inter/Intranet File Transfer
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <Tabs defaultValue="code-share" className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-gray-800 border border-cyan-400">
                <TabsTrigger
                  value="code-share"
                  className="data-[state=active]:bg-cyan-400 data-[state=active]:text-gray-900 text-cyan-300 text-sm font-head"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Code Share
                </TabsTrigger>
                <TabsTrigger
                  value="network-share"
                  className="data-[state=active]:bg-purple-500 data-[state=active]:text-white text-purple-300 font-head"
                >
                  <Wifi className="w-4 h-4 mr-2" />
                  Network Share
                </TabsTrigger>
              </TabsList>

              {/* Code Share Mode */}
              <TabsContent value="code-share" className="space-y-6 mt-6">
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Send Files */}
                  <Card className="bg-gray-800/50 border border-cyan-400/50">
                    <CardHeader>
                      <CardTitle className="text-cyan-300 font-head flex items-center gap-2">
                        <Upload className="w-4 h-4" />
                        TRANSMIT
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div 
                        className={`border-2 border-dashed ${isDragging ? 'border-green-400 bg-green-400/10' : 'border-cyan-400/50'} rounded-lg p-6 text-center hover:border-cyan-400 transition-colors`}
                        onDragEnter={handleDragEnter}
                        onDragLeave={handleDragLeave}
                        onDragOver={handleDragOver}
                        onDrop={handleDrop}
                      >
                        <Upload className="w-8 h-8 text-cyan-400 mx-auto mb-2" />
                        <p className="text-cyan-300 font-head mb-2">
                          {isDragging ? 'Drop files here' : 'Drop files here or'}
                        </p>
                        <input 
                          type="file" 
                          multiple 
                          onChange={handleFileSelect} 
                          className="hidden" 
                          id="file-upload" 
                          ref={fileInputRef}
                        />
                        <label htmlFor="file-upload">
                          <Button
                            variant="outline"
                            className="bg-cyan-400 text-gray-900 border-cyan-400 hover:bg-cyan-300 font-head"
                            onClick={() => fileInputRef.current?.click()}
                          >
                            SELECT FILES
                          </Button>
                        </label>
                      </div>
                      
                      <Button
                        onClick={handleUpload}
                        disabled={selectedFiles.length === 0 || uploading}
                        className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 font-head"
                      >
                        {uploading ? (
                          <>
                            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                            UPLOADING...
                          </>
                        ) : (
                          'UPLOAD FILES'
                        )}
                      </Button>
                      
                      {selectedFiles.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-cyan-300 font-head text-sm">Selected files:</p>
                          {selectedFiles.map((file, index) => (
                            <div key={index} className="bg-gray-700/50 p-2 rounded border border-cyan-400/30">
                              <p className="text-cyan-200 font-head text-sm">{file.name}</p>
                              <p className="text-gray-400 font-head text-xs">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
                            </div>
                          ))}
                        </div>
                      )}

                      {uploadError && (
                        <div className="bg-red-900/30 p-3 rounded border border-red-400/50">
                          <p className="text-red-300 font-head text-sm">{uploadError}</p>
                        </div>
                      )}

                      {shareCode && (
                        <div className="bg-gray-700/50 p-4 rounded border border-green-400">
                          <p className="text-green-300 font-head text-sm mb-2">Share Code Generated:</p>
                          <div className="flex items-center gap-2">
                            <code className="bg-gray-900 px-3 py-2 rounded text-green-400 font-head text-lg flex-1">
                              {shareCode}
                            </code>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => copyToClipboard(shareCode)}
                              className="border-green-400 text-green-400 hover:bg-green-400 hover:text-gray-900"
                            >
                              {copied ? 'COPIED!' : <Copy className="w-4 h-4" />}
                            </Button>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Receive Files */}
                  <Card className="bg-gray-800/50 border border-purple-400/50">
                    <CardHeader>
                      <CardTitle className="text-purple-300 font-head flex items-center gap-2">
                        <Download className="w-4 h-4" />
                        RECEIVE
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label htmlFor="receive-code" className="text-purple-300 font-head">
                          Enter Share Code
                        </Label>
                        <Input
                          id="receive-code"
                          value={inputCode}
                          onChange={(e) => setInputCode(e.target.value.toUpperCase().slice(0, 6))}
                          placeholder="ABC123"
                          className="bg-gray-700 border-purple-400/50 text-purple-200 font-head text-center text-lg tracking-widest mt-2"
                          maxLength={6}
                        />
                      </div>

                      <Button
                        onClick={handleDownload}
                        disabled={inputCode.length !== 6 || downloading}
                        className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 font-head"
                      >
                        {downloading ? (
                          <>
                            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                            DOWNLOADING...
                          </>
                        ) : (
                          'DOWNLOAD FILES'
                        )}
                      </Button>

                      {downloadError && (
                        <div className="bg-red-900/30 p-3 rounded border border-red-400/50">
                          <p className="text-red-300 font-head text-sm">{downloadError}</p>
                        </div>
                      )}

                      {downloadMessage && (
                        <div className="bg-green-900/30 p-3 rounded border border-green-400/50">
                          <p className="text-green-300 font-head text-sm">{downloadMessage}</p>
                        </div>
                      )}

                      <div className="bg-gray-700/30 p-4 rounded border border-purple-400/30">
                        <p className="text-purple-300 font-head text-sm">
                          {"> Enter the 6-character code from sender and click download."}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Network Share Mode */}
              <TabsContent value="network-share" className="space-y-6 mt-6">
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Network Scanner */}
                  <Card className="bg-gray-800/50 border border-purple-400/50">
                    <CardHeader>
                      <CardTitle className="text-purple-300 font-head flex items-center gap-2">
                        <Wifi className="w-4 h-4" />
                        NETWORK SCAN
                        <Badge variant="outline" className="ml-2 bg-cyan-600/20 text-cyan-300 border-cyan-500">
                          Demo Mode
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <Button
                        onClick={scanNetwork}
                        disabled={isScanning}
                        className="w-full bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-500 hover:to-teal-500 font-head"
                      >
                        {isScanning ? (
                          <>
                            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                            SCANNING...
                          </>
                        ) : (
                          <>
                            <Wifi className="w-4 h-4 mr-2" />
                            SCAN NETWORK
                          </>
                        )}
                      </Button>

                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        <div className="flex justify-between items-center">
                          <p className="text-purple-300 font-head text-sm">Discovered Devices:</p>
                          <Button 
                            size="sm"
                            onClick={scanNetwork}
                            disabled={isScanning}
                            className="bg-purple-600 hover:bg-purple-700 text-white font-head text-xs"
                          >
                            {isScanning ? (
                              <>
                                <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                                SCANNING...
                              </>
                            ) : (
                              <>
                                <Wifi className="w-3 h-3 mr-1" />
                                SCAN
                              </>
                            )}
                          </Button>
                        </div>
                        
                        {discoveredDevices.length === 0 ? (
                          <div className="bg-gray-700/50 p-3 rounded border border-purple-400/30">
                            <p className="text-gray-400 font-head text-sm">No devices found. Try scanning again.</p>
                          </div>
                        ) : (
                          discoveredDevices.map((device, index) => (
                            <div
                              key={index}
                              className={`bg-gray-700/50 p-3 rounded border ${
                                selectedPeer?.id === device.id 
                                  ? 'border-green-400' 
                                  : 'border-purple-400/30 hover:border-purple-400'
                              } transition-colors cursor-pointer`}
                              onClick={() => connectToPeer(device)}
                            >
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="text-purple-200 font-head text-sm">{device.name}</p>
                                  <p className="text-gray-400 font-head text-xs">
                                    {device.type === 'mobile' ? '📱 Mobile' : '💻 Desktop'}
                                    {device.isLocal && ' • Same Network'}
                                  </p>
                                </div>
                                <Badge variant="outline" className={`${
                                  selectedPeer?.id === device.id && isConnected
                                    ? 'border-green-400 text-green-400'
                                    : selectedPeer?.id === device.id && isConnecting
                                      ? 'border-yellow-400 text-yellow-400'
                                      : 'border-blue-400 text-blue-400'
                                } font-head text-xs`}>
                                  {selectedPeer?.id === device.id && isConnected
                                    ? 'connected'
                                    : selectedPeer?.id === device.id && isConnecting
                                      ? 'connecting...'
                                      : 'online'}
                                </Badge>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Manual IP Entry */}
                  <Card className="bg-gray-800/50 border border-cyan-400/50">
                    <CardHeader>
                      <CardTitle className="text-cyan-300 font-head flex items-center gap-2">
                        <Monitor className="w-4 h-4" />
                        DIRECT CONNECT
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label htmlFor="manual-ip" className="text-cyan-300 font-head">
                          IP Address / Hostname
                        </Label>
                        <div className="flex mt-2">
                          <Input
                            id="manual-ip"
                            value={manualIP}
                            onChange={(e) => setManualIP(e.target.value)}
                            placeholder="192.168.1.100"
                            className="bg-gray-700 border-cyan-400/50 text-cyan-200 font-head flex-1 mr-2"
                          />
                          <Button
                            onClick={handleManualConnect}
                            disabled={!manualIP}
                            className="bg-cyan-600 hover:bg-cyan-700 text-white font-head"
                          >
                            CONNECT
                          </Button>
                        </div>
                      </div>
                      
                      <div>
                        <input 
                          type="file" 
                          multiple 
                          onChange={handleNetworkFileSelect} 
                          className="hidden" 
                          id="network-file-upload" 
                          ref={networkFileInputRef}
                        />
                        
                        <div 
                          className={`border-2 border-dashed border-cyan-400/50 rounded-lg p-4 text-center ${
                            isConnected ? 'hover:border-cyan-400 cursor-pointer' : 'opacity-50'
                          }`}
                          onClick={() => isConnected && networkFileInputRef.current?.click()}
                        >
                          {selectedPeer && (
                            <div className="mt-2 bg-gray-700/50 p-2 rounded border border-cyan-400/30">
                              <p className="text-cyan-300 font-head text-sm">
                                Status: {isConnected 
                                  ? 'Connected to' 
                                  : isConnecting 
                                    ? 'Connecting to' 
                                    : transferError 
                                      ? 'Connection failed with' 
                                      : 'Selected'} {selectedPeer.name}
                              </p>
                              {selectedPeer.localIpHint && (
                                <p className="text-gray-400 font-head text-xs">IP: {selectedPeer.localIpHint}</p>
                              )}
                              {isConnecting && (
                                <div className="flex items-center mt-1">
                                  <RefreshCw className="w-3 h-3 text-yellow-400 mr-2 animate-spin" />
                                  <p className="text-yellow-400 font-head text-xs">Establishing connection...</p>
                                </div>
                              )}
                              {transferError && (
                                <div className="flex items-center mt-1">
                                  <p className="text-red-400 font-head text-xs">{transferError}</p>
                                </div>
                              )}
                            </div>
                          )}
                          <Upload className="w-6 h-6 text-cyan-400 mx-auto mb-2" />
                          <p className="text-cyan-300 font-head text-sm">
                            {isConnected 
                              ? networkSelectedFiles.length > 0 
                                ? `${networkSelectedFiles.length} file(s) selected` 
                                : "Select files to send" 
                              : selectedPeer
                                ? "Connecting to peer..."
                                : "Select a device first"}
                          </p>
                        </div>
                        
                        {networkSelectedFiles.length > 0 && (
                          <div className="mt-2 space-y-2">
                            {networkSelectedFiles.map((file, index) => (
                              <div key={index} className="bg-gray-700/50 p-2 rounded border border-cyan-400/30">
                                <p className="text-cyan-200 font-head text-sm">{file.name}</p>
                                <p className="text-gray-400 font-head text-xs">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
                              </div>
                            ))}
                          </div>
                        )}
                        
                        {transferProgress > 0 && (
                          <div className="mt-2 bg-gray-700/50 p-2 rounded border border-cyan-400/30">
                            <div className="w-full bg-gray-800 h-2 rounded-full overflow-hidden">
                              <div 
                                className="bg-gradient-to-r from-cyan-400 to-blue-500 h-full" 
                                style={{ width: `${transferProgress}%` }}
                              />
                            </div>
                            <p className="text-cyan-300 font-head text-xs mt-1 text-center">
                              {transferProgress === 100 ? 'Transfer Complete!' : `${transferProgress}% Complete`}
                            </p>
                          </div>
                        )}
                        
                        {transferError && (
                          <div className="mt-2 bg-red-900/30 p-2 rounded border border-red-400/30">
                            <p className="text-red-300 font-head text-xs">Error: {transferError}</p>
                          </div>
                        )}
                        
                        <Button
                          onClick={handleP2PTransfer}
                          disabled={!isConnected || networkSelectedFiles.length === 0 || transferProgress > 0 && transferProgress < 100}
                          className="w-full mt-4 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 font-head"
                        >
                          {transferProgress > 0 && transferProgress < 100 ? (
                            <>
                              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                              SENDING...
                            </>
                          ) : (
                            'SEND FILES'
                          )}
                        </Button>
                      </div>

                      {isConnected && (
                        <div className="mt-4 space-y-2">
                          <div className="flex items-center">
                            <Input 
                              value={chatMessage}
                              onChange={(e) => setChatMessage(e.target.value)}
                              placeholder="Type a test message..."
                              className="bg-gray-700 border-cyan-400/50 text-cyan-200 font-head flex-1 mr-2"
                              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                            />
                            <Button
                              onClick={handleSendMessage}
                              disabled={!chatMessage.trim()}
                              className="bg-cyan-600 hover:bg-cyan-700 text-white font-head"
                            >
                              <Send className="w-4 h-4" />
                            </Button>
                          </div>
                          
                          {chatMessages.length > 0 && (
                            <div className="bg-gray-700/50 p-3 rounded border border-cyan-400/30 max-h-32 overflow-y-auto">
                              {chatMessages.map((msg, idx) => (
                                <div key={idx} className={`mb-1 ${msg.sent ? 'text-right' : 'text-left'}`}>
                                  <span className={`inline-block py-1 px-2 rounded ${
                                    msg.sent 
                                      ? 'bg-cyan-700/70 text-cyan-100' 
                                      : 'bg-purple-700/70 text-purple-100'
                                  } font-head text-xs`}>
                                    {msg.message}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-cyan-400/60 font-head text-sm">
            {"> RetroShare v1.1 - Made with "}<Heart className="inline-block w-4 h-4 text-red-500 mx-1" />{" by msnotfound"}
          </p>
        </div>
      </div>
    </div>
  )
}