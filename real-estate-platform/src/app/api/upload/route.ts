import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join, extname } from 'path';
import { getAuthUser } from '@/lib/auth';
import { uploadLimiter, rateLimitResponse } from '@/lib/rate-limit';
import { successResponse, errorResponse } from '@/lib/utils';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const UPLOAD_DIR = join(process.cwd(), 'public', 'uploads');

// ============================================
// POST /api/upload - Upload images (Admin only)
// ============================================
export async function POST(req: NextRequest) {
  const { success, reset } = uploadLimiter.check(req);
  if (!success) return rateLimitResponse(reset);

  try {
    const authUser = await getAuthUser(req);
    if (!authUser) return NextResponse.json(errorResponse('Unauthorized'), { status: 401 });
    // Allow all authenticated users to upload images (not just admins)

    const formData = await req.formData();
    const files = formData.getAll('files') as File[];

    if (!files || files.length === 0) {
      return NextResponse.json(errorResponse('No files provided'), { status: 400 });
    }

    if (files.length > 10) {
      return NextResponse.json(errorResponse('Maximum 10 files allowed'), { status: 400 });
    }

    // Ensure upload directory exists
    await mkdir(UPLOAD_DIR, { recursive: true });

    const uploadedFiles: string[] = [];
    const errors: string[] = [];

    for (const file of files) {
      // Validate file type
      if (!ALLOWED_TYPES.includes(file.type)) {
        errors.push(`${file.name}: Invalid file type. Allowed: JPEG, PNG, WebP, AVIF`);
        continue;
      }

      // Validate file size
      if (file.size > MAX_FILE_SIZE) {
        errors.push(`${file.name}: File too large. Maximum size is 5MB`);
        continue;
      }

      try {
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Generate unique filename
        const ext = extname(file.name).toLowerCase() || '.jpg';
        const uniqueName = `property-${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;
        const filePath = join(UPLOAD_DIR, uniqueName);

        await writeFile(filePath, buffer);
        uploadedFiles.push(`/uploads/${uniqueName}`);
      } catch (err) {
        console.error(`Failed to save file ${file.name}:`, err);
        errors.push(`${file.name}: Failed to save file`);
      }
    }

    if (uploadedFiles.length === 0) {
      return NextResponse.json(
        errorResponse('No files were uploaded successfully', { files: errors }),
        { status: 400 }
      );
    }

    return NextResponse.json(
      successResponse(
        { urls: uploadedFiles, errors: errors.length > 0 ? errors : undefined },
        `${uploadedFiles.length} file(s) uploaded successfully`
      ),
      { status: 201 }
    );
  } catch (error) {
    console.error('[UPLOAD ERROR]', error);
    return NextResponse.json(errorResponse('Internal server error'), { status: 500 });
  }
}
