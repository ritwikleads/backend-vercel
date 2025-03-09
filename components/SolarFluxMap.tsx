import React, { useEffect, useRef, useState } from 'react';
import * as GeoTIFF from 'geotiff';
import { Download } from 'lucide-react';

interface SolarFluxMapProps {
  annualFluxUrl: string;
  imageryDate?: string;
  imageryProcessedDate?: string;
  imageryQuality?: string;
}

const SolarFluxMap: React.FC<SolarFluxMapProps> = ({ 
  annualFluxUrl,
  imageryDate,
  imageryProcessedDate,
  imageryQuality
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tiffId, setTiffId] = useState<string | null>(null);

  useEffect(() => {
    const fetchAndRenderTiff = async () => {
      if (!annualFluxUrl || !canvasRef.current) return;

      try {
        setLoading(true);
        
        // Extract the ID from the annualFluxUrl
        const urlParams = new URLSearchParams(new URL(annualFluxUrl).search);
        const id = urlParams.get('id');
        
        if (!id) {
          throw new Error('Could not extract ID from annualFluxUrl');
        }

        // Store the ID for download button
        setTiffId(id);

        // Fetch the TIFF file from our API
        const response = await fetch(`/api/getFluxData?id=${id}`);
        if (!response.ok) {
          throw new Error(`Failed to fetch flux data: ${response.status}`);
        }

        // Get the array buffer from the response
        const arrayBuffer = await response.arrayBuffer();
        
        // Parse the GeoTIFF
        const tiff = await GeoTIFF.fromArrayBuffer(arrayBuffer);
        const image = await tiff.getImage();
        const width = image.getWidth();
        const height = image.getHeight();
        
        // Read the raster data
        const data = await image.readRasters();
        // Fix: Properly type the raster data as TypedArray
        const raster = data[0] as Float32Array | Float64Array | Int16Array | Uint8Array;
        
        // Set up the canvas
        const canvas = canvasRef.current;
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          throw new Error('Could not get canvas context');
        }
        
        // Create an image data object
        const imageData = ctx.createImageData(width, height);
        
        // Find the min and max values for normalization
        let min = Infinity;
        let max = -Infinity;
        
        for (let i = 0; i < raster.length; i++) {
          const value = raster[i];
          if (value > 0) { // Ignore no-data values (typically 0 or negative)
            min = Math.min(min, value);
            max = Math.max(max, value);
          }
        }
        
        // Create a color scale function (blue to yellow to red)
        const getColor = (value: number): [number, number, number] => {
          if (value <= 0) return [0, 0, 0]; // No data or 0 values are transparent
          
          const normalized = (value - min) / (max - min);
          
          if (normalized < 0.5) {
            // Blue to Yellow (0 to 0.5)
            const t = normalized * 2;
            return [
              Math.round(255 * t),
              Math.round(255 * t),
              Math.round(255 * (1 - t))
            ];
          } else {
            // Yellow to Red (0.5 to 1)
            const t = (normalized - 0.5) * 2;
            return [
              255,
              Math.round(255 * (1 - t)),
              0
            ];
          }
        };
        
        // Fill the image data
        for (let i = 0; i < raster.length; i++) {
          const value = raster[i];
          const [r, g, b] = getColor(value);
          
          // RGBA values
          imageData.data[i * 4] = r;
          imageData.data[i * 4 + 1] = g;
          imageData.data[i * 4 + 2] = b;
          imageData.data[i * 4 + 3] = value > 0 ? 255 : 0; // Alpha channel (transparent for no data)
        }
        
        // Put the image data on the canvas
        ctx.putImageData(imageData, 0, 0);
        
        setLoading(false);
      } catch (err) {
        console.error('Error rendering TIFF:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
        setLoading(false);
      }
    };

    fetchAndRenderTiff();
  }, [annualFluxUrl]);

  // Format date string
  const formatDate = (dateString?: string): string => {
    if (!dateString) return 'N/A';
    
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (e) {
      return dateString;
    }
  };

  // Handle download button click
  const handleDownload = () => {
    if (!tiffId) return;
    
    // Create a download link
    const downloadUrl = `/api/getFluxData?id=${tiffId}`;
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = 'solar-flux-data.tiff';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="relative w-full">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 bg-opacity-75">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-2 text-sm text-gray-600">Loading solar flux data...</p>
          </div>
        </div>
      )}
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative">
          <strong className="font-bold">Error:</strong>
          <span className="block sm:inline"> {error}</span>
        </div>
      )}
      
      <div className="rounded-lg overflow-hidden shadow-lg">
        <div className="relative">
          <canvas 
            ref={canvasRef} 
            className="w-full h-auto"
            style={{ display: loading ? 'none' : 'block' }}
          />
          
          {/* Solar Flux Legend */}
          {!loading && !error && (
            <div className="absolute bottom-4 right-4 bg-white/90 rounded-lg p-3 shadow-lg">
              <div className="flex items-center space-x-2">
                <div className="w-24 h-3 bg-gradient-to-r from-blue-600 via-yellow-400 to-red-500 rounded" />
                <div className="text-xs text-gray-700 space-x-2">
                  <span>Low</span>
                  <span>→</span>
                  <span>High</span>
                </div>
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Annual Solar Potential
              </div>
            </div>
          )}
          
          {/* Download Button */}
          {!loading && !error && tiffId && (
            <div className="absolute top-4 right-4">
              <button
                onClick={handleDownload}
                className="bg-white/90 hover:bg-white text-blue-600 p-2 rounded-full shadow-lg transition-colors"
                title="Download TIFF file"
              >
                <Download className="h-5 w-5" />
              </button>
            </div>
          )}
        </div>
        
        {/* Imagery Information */}
        <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4 bg-gray-50">
          <div className="text-center">
            <p className="text-sm text-gray-600">Analysis Date</p>
            <p className="font-semibold text-gray-800">{formatDate(imageryProcessedDate)}</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600">Imagery Date</p>
            <p className="font-semibold text-gray-800">{formatDate(imageryDate)}</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600">Imagery Quality</p>
            <p className="font-semibold text-gray-800">{imageryQuality || 'N/A'}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SolarFluxMap; 