import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'Missing id parameter' }, { status: 400 });
    }

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_SOLAR_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
    }

    // Fetch the TIFF file from Google Solar API
    const response = await fetch(
      `https://solar.googleapis.com/v1/geoTiff:get?id=${id}&key=${apiKey}`,
      {
        method: 'GET',
        headers: {
          'Accept': 'image/tiff',
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error fetching TIFF:', errorText);
      return NextResponse.json(
        { error: `Failed to fetch TIFF: ${response.status}` },
        { status: response.status }
      );
    }

    // Get the TIFF data as an ArrayBuffer
    const tiffData = await response.arrayBuffer();
    
    // Return the TIFF data with appropriate headers
    return new NextResponse(tiffData, {
      headers: {
        'Content-Type': 'image/tiff',
        'Content-Disposition': 'attachment; filename="solar-flux-data.tiff"',
      },
    });
  } catch (error) {
    console.error('Error in getFluxData API route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 