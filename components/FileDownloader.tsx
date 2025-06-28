import React, { useState } from 'react';

const FileDownloader: React.FC = () => {
  const [inputCode, setInputCode] = useState<string>('');
  const [downloading, setDownloading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [downloadMessage, setDownloadMessage] = useState<string>('');

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    // Optionally, you can convert to uppercase and limit length here
    setInputCode(event.target.value.toUpperCase().slice(0, 6));
  };

  const handleDownload = async () => {
    if (inputCode.length !== 6) {
      setError('Please enter a valid 6-digit code.');
      return;
    }

    setDownloading(true);
    setError('');
    setDownloadMessage('');

    try {
      console.log(`Requesting download link for code: ${inputCode}...`);
      const response = await fetch('/api/resolve-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ shareCode: inputCode }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to get download link.');
      }

      const result = await response.json();
      const downloadUrl = result.downloadUrl;
      const fileName = result.fileName || 'download.zip'; // Use filename from backend or default

      console.log(`Received download URL for ${fileName}:`, downloadUrl);

      // --- Initiate Download without opening a new window ---
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', fileName); // Suggest a filename for the download
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      // --- End Download Initiation ---

      setDownloadMessage(`Download of "${fileName}" started!`);
      setInputCode(''); // Clear input after initiating download

    } catch (err: any) {
      console.error('Download initiation failed:', err);
      setError(`Download failed: ${err.message || 'An unknown error occurred.'}`);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4 font-sans">
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md text-center">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Download File</h1>

        <p className="text-gray-600 mb-4">Enter the 6-digit code to download your file.</p>

        <input
          type="text"
          value={inputCode}
          onChange={handleInputChange}
          maxLength={6}
          placeholder="Enter 6-digit code"
          className="w-full p-3 border border-gray-300 rounded-lg text-xl text-center font-mono uppercase mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <button
          onClick={handleDownload}
          disabled={inputCode.length !== 6 || downloading}
          className={`w-full py-3 px-6 rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-opacity-75 transition duration-300 ease-in-out text-lg
            ${inputCode.length === 6 && !downloading
              ? 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
        >
          {downloading ? (
            <div className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Preparing Download...
            </div>
          ) : (
            'Download File'
          )}
        </button>

        {error && (
          <p className="text-red-600 mt-4 text-sm whitespace-pre-wrap">{error}</p>
        )}

        {downloadMessage && (
          <p className="text-green-600 mt-4 text-base">{downloadMessage}</p>
        )}
      </div>
    </div>
  );
};

export default FileDownloader;
