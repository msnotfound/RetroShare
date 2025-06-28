import React, { useState, useRef, ChangeEvent } from 'react';

// Define the shape of the data received after a successful upload
interface UploadSuccessResponse {
  message: string;
  archiveName: string;
  shareCode: string; // The 6-digit code from the backend
  filesCount: number;
}

const MultiFileUploader: React.FC = () => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState<boolean>(false);
  const [shareCode, setShareCode] = useState<string>(''); // State for the 6-digit code
  const [error, setError] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      setSelectedFiles(Array.from(files));
      setShareCode(''); // Clear previous code
      setError('');
    } else {
      setSelectedFiles([]);
    }
  };

  const handleSubmit = async () => {
    if (selectedFiles.length === 0) {
      setError('Please select at least one file to upload.');
      return;
    }

    setUploading(true);
    setError('');
    setShareCode('');

    try {
      const formData = new FormData();
      selectedFiles.forEach((file) => {
        formData.append('files', file); // 'files' matches backend Multer config
      });

      console.log(`Sending ${selectedFiles.length} file(s) for compression and upload...`);

      for (let [key, value] of formData.entries()) {
        console.log(`FormData contains: ${key}:`, value);
      }
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

      setShareCode(result.shareCode); // Set the 6-digit code
      setSelectedFiles([]); // Clear selected files

    } catch (err: any) {
      console.error('Upload process failed:', err);
      setError(`Upload failed: ${err.message || 'An unknown error occurred.'}`);
    } finally {
      setUploading(false);
    }
  };
  const [copied, setCopied] = useState<boolean>(false);
  const copyCodeToClipboard = () => {
    if (shareCode) {
      navigator.clipboard.writeText(shareCode)
        .then(() => {
          setCopied(true);
          // Reset the "Copied!" text after 2 seconds
          setTimeout(() => {
            setCopied(false);
          }, 2000);
        })
        .catch(err => {
          console.error('Failed to copy code: ', err);
          // Fallback for browsers that don't support clipboard API
          const textArea = document.createElement('textarea');
          textArea.value = shareCode;
          document.body.appendChild(textArea);
          textArea.select();
          try {
            document.execCommand('copy');
            setCopied(true);
            setTimeout(() => {
              setCopied(false);
            }, 2000);
          } catch (err) {
            console.error('Fallback copy failed: ', err);
          }
          document.body.removeChild(textArea);
        });
      }
    };
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4 font-sans">
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md text-center">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Upload Files</h1>

        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          multiple
          className="hidden"
          accept="*"
        />

        <button
          onClick={() => fileInputRef.current?.click()}
          className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-75 transition duration-300 ease-in-out mb-4 text-lg"
        >
          {selectedFiles.length > 0
            ? `Change Selection (${selectedFiles.length} File(s) Selected)`
            : 'Select Files to Upload'
          }
        </button>

        {selectedFiles.length > 0 && (
          <div className="text-left text-gray-700 text-sm mb-4 p-3 border border-gray-200 rounded-md bg-gray-50 max-h-48 overflow-y-auto">
            <p className="font-semibold mb-2">Selected Files:</p>
            <ul>
              {selectedFiles.map((file, index) => (
                <li key={file.name + index} className="truncate py-1">
                  <span className="font-medium">{file.name}</span> ({(file.size / (1024 * 1024)).toFixed(2)} MB)
                </li>
              ))}
            </ul>
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={selectedFiles.length === 0 || uploading}
          className={`w-full py-3 px-6 rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-opacity-75 transition duration-300 ease-in-out text-lg
            ${selectedFiles.length > 0 && !uploading
              ? 'bg-green-500 text-white hover:bg-green-600 focus:ring-green-500'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
        >
          {uploading ? (
            <div className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Uploading...
            </div>
          ) : (
            `Upload ${selectedFiles.length > 0 ? selectedFiles.length : ''} File(s)`
          )}
        </button>

        {error && (
          <p className="text-red-600 mt-4 text-sm whitespace-pre-wrap">{error}</p>
        )}

        {shareCode && (
          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-yellow-800 font-semibold mb-2 text-xl">Share this code:</p>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={shareCode}
                readOnly
                className="flex-grow p-2 border border-yellow-300 rounded-md text-2xl font-bold text-center bg-yellow-100"
              />
              <button
  onClick={copyCodeToClipboard}
  className="bg-yellow-500 text-white py-2 px-4 rounded-md shadow-sm hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-opacity-75 transition duration-300 ease-in-out text-sm">
    {copied ? 'Copied!' : 'Copy'}
            </button>
            </div>
            <p className="text-xs text-yellow-600 mt-2">
              This code can be used to download your file.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MultiFileUploader;
