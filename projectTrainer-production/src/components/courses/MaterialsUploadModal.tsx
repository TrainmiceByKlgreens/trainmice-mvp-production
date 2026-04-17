import { useState, useRef } from 'react';
import { X, Upload, FileText, Trash2, Loader } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card, CardContent, CardHeader } from '../ui/Card';
import { uploadCourseMaterial, deleteCourseMaterial, fetchCourseMaterials } from '../../lib/courseService';
import { CourseMaterial } from '../../types/database';

interface MaterialsUploadModalProps {
  courseId: string;
  courseName: string;
  onClose: () => void;
  materials: CourseMaterial[];
  onMaterialsUpdate: (materials: CourseMaterial[]) => void;
  readOnly?: boolean;
}

const ALLOWED_EXTENSIONS = ['pdf', 'ppt', 'pptx', 'doc', 'docx', 'jpg', 'jpeg', 'png', 'mp4'];

export function MaterialsUploadModal({
  courseId,
  courseName,
  onClose,
  materials,
  onMaterialsUpdate,
  readOnly = false,
}: MaterialsUploadModalProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): boolean => {
    const extension = file.name.split('.').pop()?.toLowerCase();
    return extension ? ALLOWED_EXTENSIONS.includes(extension) : false;
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (readOnly) return;

    const files = event.target.files;
    if (!files || files.length === 0) return;

    const validFiles = Array.from(files).filter(validateFile);

    if (validFiles.length === 0) {
      alert('No valid files selected. Please upload PDF, PPT, DOC, JPG, PNG, or MP4 files.');
      return;
    }

    if (validFiles.length !== files.length) {
      alert('Some files were skipped due to invalid format.');
    }

    setUploading(true);
    const uploadedMaterials: CourseMaterial[] = [];

    for (let i = 0; i < validFiles.length; i++) {
      const file = validFiles[i];
      setUploadProgress(`Uploading ${i + 1} of ${validFiles.length}: ${file.name}`);

      try {
        const material = await uploadCourseMaterial(courseId, file);
        uploadedMaterials.push(material);
      } catch (error) {
        console.error('Error uploading file:', error);
        alert(`Failed to upload ${file.name}`);
      }
    }

    alert('Successfull upload');
    setUploading(false);
    setUploadProgress('');

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    const updatedMaterials = await fetchCourseMaterials(courseId);
    onMaterialsUpdate(updatedMaterials);
  };

  const handleDelete = async (material: CourseMaterial) => {
    if (readOnly) return;
    if (!confirm(`Delete ${material.file_name}?`)) return;

    try {
      await deleteCourseMaterial(courseId, material.id);
      const updatedMaterials = await fetchCourseMaterials(courseId);
      onMaterialsUpdate(updatedMaterials);
    } catch (error) {
      console.error('Error deleting material:', error);
      alert('Failed to delete material');
    }
  };

  const getFileIcon = (fileName: string) => {
    void fileName;
    return <FileText className="w-5 h-5 text-blue-600" />;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Course Materials</h2>
              <p className="text-sm text-gray-600 mt-1">{courseName}</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </CardHeader>

        <CardContent className="flex-1 overflow-y-auto">
          <div className="space-y-6">
            {readOnly ? (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                <p className="text-sm font-medium text-amber-800">
                  You have view-only access to these materials. Upload and delete actions are limited to the primary trainer.
                </p>
              </div>
            ) : (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors">
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".pdf,.ppt,.pptx,.doc,.docx,.jpg,.jpeg,.png,.mp4"
                  onChange={handleFileSelect}
                  className="hidden"
                  disabled={uploading}
                />

                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />

                <Button
                  type="button"
                  variant="primary"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="mb-2"
                >
                  {uploading ? (
                    <>
                      <Loader className="w-4 h-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Select Files
                    </>
                  )}
                </Button>

                {uploadProgress && (
                  <p className="text-sm text-blue-600 mt-2">{uploadProgress}</p>
                )}

                <p className="text-sm text-gray-500 mt-2">
                  Supported formats: PDF, PPT, PPTX, DOC, DOCX, JPG, PNG, MP4
                </p>
              </div>
            )}

            {materials.length > 0 ? (
              <div>
                <h3 className="font-medium text-gray-900 mb-3">
                  Uploaded Materials ({materials.length})
                </h3>
                <div className="space-y-2">
                  {materials.map((material) => (
                    <div
                      key={material.id}
                      className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          {getFileIcon(material.file_name)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {material.file_name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(material.uploaded_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <a
                          href={material.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:text-blue-700 px-3 py-1"
                        >
                          View
                        </a>
                        {!readOnly && (
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => handleDelete(material)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 px-2 py-1"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No materials uploaded yet</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
