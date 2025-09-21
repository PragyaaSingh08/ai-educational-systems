import { BulkDatasetUploader } from "@/components/bulk-dataset-uploader"

export default function BulkUploadPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Bulk Dataset Upload</h1>
        <p className="text-muted-foreground mt-2">Upload face recognition datasets for multiple students at once</p>
      </div>

      <BulkDatasetUploader />
    </div>
  )
}
