// Cuts the subject out of a photo with Apple Vision (on-device, nothing uploaded) and
// writes public/portrait/portrait.png (RGB = photo, A = person mask, 512px wide),
// which the particle portrait in src/gl/portrait.js samples.
// Usage: swift posters/portrait.swift <photo> <out.png> [cropX cropY cropW cropH]
import AppKit
import CoreImage
import CoreImage.CIFilterBuiltins
import Vision

let args = CommandLine.arguments
guard args.count >= 3, let src = NSImage(contentsOfFile: args[1]),
      let cg = src.cgImage(forProposedRect: nil, context: nil, hints: nil) else {
  fatalError("usage: swift portrait.swift <photo> <out.png> [x y w h]")
}
let W = CGFloat(cg.width), H = CGFloat(cg.height)
// Crop in top-left pixel coordinates (default: whole image).
let crop = args.count >= 7
  ? CGRect(x: Double(args[3])!, y: Double(args[4])!, width: Double(args[5])!, height: Double(args[6])!)
  : CGRect(x: 0, y: 0, width: W, height: H)

let request = VNGeneratePersonSegmentationRequest()
request.qualityLevel = .accurate
request.outputPixelFormat = kCVPixelFormatType_OneComponent8
try VNImageRequestHandler(cgImage: cg).perform([request])
guard let maskBuffer = request.results?.first?.pixelBuffer else { fatalError("no person found") }

let photo = CIImage(cgImage: cg)
var mask = CIImage(cvPixelBuffer: maskBuffer)
mask = mask.transformed(by: CGAffineTransform(scaleX: W / mask.extent.width, y: H / mask.extent.height))

let cut = CIFilter.blendWithAlphaMask()
cut.inputImage = photo
cut.backgroundImage = CIImage(color: .clear).cropped(to: photo.extent)
cut.maskImage = mask.applyingFilter("CIMaskToAlpha")

// Top-left crop → Core Image's bottom-left space, then scale to 512px wide.
let r = CGRect(x: crop.minX, y: H - crop.maxY, width: crop.width, height: crop.height)
let s = 760 / r.width
let img = cut.outputImage!.cropped(to: r)
  .transformed(by: CGAffineTransform(translationX: -r.minX, y: -r.minY))
  .transformed(by: CGAffineTransform(scaleX: s, y: s))
let rep = NSBitmapImageRep(cgImage: CIContext().createCGImage(img, from: img.extent)!)
try rep.representation(using: .png, properties: [:])!.write(to: URL(fileURLWithPath: args[2]))
print("wrote \(args[2]) \(Int(img.extent.width))x\(Int(img.extent.height))")
