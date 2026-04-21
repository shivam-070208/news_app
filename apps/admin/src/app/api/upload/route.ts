import { NextResponse } from "next/server"
import { v2 as cloudinary } from "cloudinary"

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export async function POST(req: Request) {
  try {
    const formData = await req.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json(
        { success: 0, error: "No file provided" },
        { status: 400 }
      )
    }

    const buffer = Buffer.from(await file.arrayBuffer())

    return new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          { resource_type: "auto", folder: "news-app" },
          (error, result) => {
            if (error) {
              console.error(error)
              resolve(
                NextResponse.json(
                  { success: 0, error: "Cloudinary upload failed" },
                  { status: 500 }
                )
              )
              return
            }

            console.log("Uploaded successfully to:", result?.secure_url)
            resolve(
              NextResponse.json({
                success: 1,
                file: {
                  url: result?.secure_url,
                },
              })
            )
          }
        )
        .end(buffer)
    })
  } catch (error) {
    console.error("Upload error:", error)
    return NextResponse.json(
      { success: 0, error: "Upload error" },
      { status: 500 }
    )
  }
}
