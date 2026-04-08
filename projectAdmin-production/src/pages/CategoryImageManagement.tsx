import React, { useState, useEffect } from 'react';
import { apiClient } from '../lib/api-client';
import { COURSE_CATEGORIES } from '../utils/categories';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';
import { Select } from '../components/common/Select';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { showToast } from '../components/common/Toast';
import { Upload, Trash2, Image as ImageIcon, X } from 'lucide-react';

export const CategoryImageManagement: React.FC = () => {
    const [selectedCategory, setSelectedCategory] = useState<string>('');
    const [images, setImages] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [previews, setPreviews] = useState<string[]>([]);

    useEffect(() => {
        if (selectedCategory) {
            fetchImages();
        } else {
            setImages([]);
        }
    }, [selectedCategory]);

    const fetchImages = async () => {
        setLoading(true);
        try {
            const { images } = await apiClient.getCategoryImages(selectedCategory);
            setImages(images || []);
        } catch (error: any) {
            showToast('Failed to fetch images', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const files = Array.from(e.target.files);
            setSelectedFiles(prev => [...prev, ...files]);

            const newPreviews = files.map(file => URL.createObjectURL(file));
            setPreviews(prev => [...prev, ...newPreviews]);
        }
    };

    const removeFile = (index: number) => {
        setSelectedFiles(prev => prev.filter((_, i) => i !== index));
        URL.revokeObjectURL(previews[index]);
        setPreviews(prev => prev.filter((_, i) => i !== index));
    };

    const handleUpload = async () => {
        if (!selectedCategory || selectedFiles.length === 0) return;

        setUploading(true);
        try {
            await apiClient.uploadCategoryImages(selectedCategory, selectedFiles);
            showToast('Images uploaded successfully', 'success');
            setSelectedFiles([]);
            setPreviews([]);
            fetchImages();
        } catch (error: any) {
            showToast(error.message || 'Upload failed', 'error');
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this image?')) return;

        try {
            await apiClient.deleteCategoryImage(id);
            showToast('Image deleted', 'success');
            fetchImages();
        } catch (error: any) {
            showToast('Failed to delete image', 'error');
        }
    };

    return (
        <div className="space-y-6">
            <Card>
                <div className="p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Manage Category Images</h3>
                    <p className="text-sm text-gray-500 mb-6">
                        Upload images for specific course categories. These images will be available for trainers to select when creating courses.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Select Category
                            </label>
                            <Select
                                options={[
                                    { value: '', label: 'Choose a category' },
                                    ...COURSE_CATEGORIES.map(cat => ({ value: cat, label: cat }))
                                ]}
                                value={selectedCategory}
                                onChange={(e) => setSelectedCategory(e.target.value)}
                            />
                        </div>
                    </div>
                </div>
            </Card>

            {selectedCategory && (
                <>
                    <Card>
                        <div className="p-6">
                            <h4 className="text-md font-medium text-gray-900 mb-4">Upload New Images</h4>

                            <div className="flex items-start space-x-4">
                                <div className="flex-1">
                                    <input
                                        type="file"
                                        multiple
                                        accept="image/*"
                                        onChange={handleFileChange}
                                        className="hidden"
                                        id="category-image-upload"
                                    />
                                    <label
                                        htmlFor="category-image-upload"
                                        className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer"
                                    >
                                        <Upload className="w-4 h-4 mr-2" />
                                        Select Images
                                    </label>
                                    <p className="mt-2 text-xs text-gray-500">
                                        Recommended: JPG, PNG or WEBP. Max size 5MB per image.
                                    </p>
                                </div>

                                {selectedFiles.length > 0 && (
                                    <Button
                                        onClick={handleUpload}
                                        disabled={uploading}
                                        variant="primary"
                                    >
                                        {uploading ? <LoadingSpinner size="sm" /> : `Upload ${selectedFiles.length} Images`}
                                    </Button>
                                )}
                            </div>

                            {previews.length > 0 && (
                                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mt-6">
                                    {previews.map((preview, index) => (
                                        <div key={index} className="relative group aspect-square rounded-lg overflow-hidden border border-gray-200">
                                            <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                                            <button
                                                onClick={() => removeFile(index)}
                                                className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <X className="w-3 h-3" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </Card>

                    <Card>
                        <div className="p-6">
                            <h4 className="text-md font-medium text-gray-900 mb-4 flex items-center">
                                Existing Images for {selectedCategory}
                                {images.length > 0 && <span className="ml-2 text-sm text-gray-500 font-normal">({images.length})</span>}
                            </h4>

                            {loading ? (
                                <div className="flex justify-center py-12">
                                    <LoadingSpinner size="lg" />
                                </div>
                            ) : images.length > 0 ? (
                                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                                    {images.map((image) => (
                                        <div key={image.id} className="relative group aspect-square rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
                                            <img src={image.imageUrl} alt="Category" className="w-full h-full object-cover" />
                                            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                                                <button
                                                    onClick={() => handleDelete(image.id)}
                                                    className="p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                                                    title="Delete image"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                                    <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                    <p className="text-gray-500">No images found for this category.</p>
                                </div>
                            )}
                        </div>
                    </Card>
                </>
            )}
        </div>
    );
};
