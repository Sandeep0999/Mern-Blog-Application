import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import RichEditor from '../components/RichEditor';
import API from '../api/axios';
import { toast } from 'react-toastify';
import { Upload, X, Loader2, ArrowLeft } from 'lucide-react';

const EditPost = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    content: '',
    image: '',
    tags: '',
  });
  const [imagePreview, setImagePreview] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchPost();
  }, [id]);

  const fetchPost = async () => {
    try {
      const { data } = await API.get(`/posts/${id}`);
      setFormData({
        title: data.title,
        subtitle: data.subtitle,
        content: data.content,
        image: data.image,
        tags: data.tags.join(', '),
      });
      setImagePreview(data.image);
    } catch (error) {
      toast.error('Failed to fetch post');
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleContentChange = (content) => {
    setFormData({
      ...formData,
      content,
    });
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5000000) {
        toast.error('Image size should be less than 5MB');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({
          ...formData,
          image: reader.result,
        });
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setFormData({
      ...formData,
      image: '',
    });
    setImagePreview('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.image) {
      toast.error('Please upload an image');
      return;
    }

    setSubmitting(true);

    try {
      const tagsArray = formData.tags
        .split(',')
        .map((tag) => tag.trim())
        .filter((tag) => tag);

      const postData = {
        ...formData,
        tags: tagsArray,
      };

      await API.put(`/posts/${id}`, postData);
      toast.success('Post updated successfully!');
      navigate(`/post/${id}`);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update post');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-white dark:bg-gray-950 transition-colors duration-300">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center space-y-4">
            <Loader2 className="h-10 w-10 animate-spin text-gray-900 dark:text-white" />
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Loading your draft editor...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-gray-950 transition-colors duration-300">
      <Navbar />

      <main className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 py-10 animate-fadeIn">
        
        {/* Navigation Breadcrumb */}
        <div className="mb-6">
          <button
            onClick={() => navigate(`/post/${id}`)}
            className="inline-flex items-center space-x-1 text-xs font-semibold text-gray-550 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Cancel and view post</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* ================= TITLES AREA (Notion borderless style) ================= */}
          <div className="space-y-2 border-b border-gray-100 dark:border-gray-800/80 pb-4">
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              maxLength={200}
              className="w-full text-3xl sm:text-4xl md:text-5xl font-sans font-black tracking-tight text-gray-900 dark:text-white placeholder-gray-250 dark:placeholder-gray-750 bg-transparent border-none focus:outline-none focus:ring-0 px-0 pb-1 mt-2 leading-tight"
              placeholder="Title"
            />
            
            <textarea
              id="subtitle"
              name="subtitle"
              value={formData.subtitle}
              onChange={handleChange}
              required
              maxLength={300}
              rows={2}
              className="w-full text-lg sm:text-xl font-sans font-light text-gray-550 dark:text-gray-400 placeholder-gray-200 dark:placeholder-gray-800 bg-transparent border-none focus:outline-none focus:ring-0 px-0 pb-1 resize-none leading-relaxed"
              placeholder="Write a brief subtitle/description..."
            />
          </div>

          {/* ================= IMAGE BANNER BLOCK ================= */}
          <div>
            <label className="block text-xs font-semibold text-gray-450 dark:text-gray-500 uppercase tracking-widest mb-3">
              Cover Image
            </label>
            {!imagePreview ? (
              <div className="border-2 border-dashed border-gray-255 dark:border-gray-800 rounded-2xl p-8 text-center hover:border-gray-400 dark:hover:border-gray-700 transition-colors bg-gray-50/30 dark:bg-gray-900/10">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  id="image-upload"
                />
                <label
                  htmlFor="image-upload"
                  className="cursor-pointer flex flex-col items-center justify-center"
                >
                  <Upload className="h-10 w-10 text-gray-400 dark:text-gray-500 mb-3" />
                  <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">
                    Upload a high-resolution featured image
                  </span>
                  <span className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                    Supports PNG, JPG, or GIF (max size 5MB)
                  </span>
                </label>
              </div>
            ) : (
              <div className="relative rounded-2xl overflow-hidden border border-gray-150 dark:border-gray-800 shadow-md">
                <img
                  src={imagePreview}
                  alt="Cover Preview"
                  className="w-full h-64 md:h-72 object-cover"
                />
                <button
                  type="button"
                  onClick={removeImage}
                  className="absolute top-3 right-3 bg-red-500 hover:bg-red-600 text-white p-2 rounded-full shadow-lg transition-colors"
                  aria-label="Remove image"
                >
                  <X className="h-4.5 w-4.5" />
                </button>
              </div>
            )}
          </div>

          {/* ================= RICH TEXT EDITOR AREA ================= */}
          <div className="space-y-2 pt-2">
            <label className="block text-xs font-semibold text-gray-450 dark:text-gray-500 uppercase tracking-widest mb-1.5">
              Article Content
            </label>
            <div className="border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden bg-white dark:bg-gray-900/10">
              <RichEditor
                value={formData.content}
                onChange={handleContentChange}
              />
            </div>
          </div>

          {/* ================= CATEGORY TAGS INPUT ================= */}
          <div className="pt-2">
            <label
              htmlFor="tags"
              className="block text-xs font-semibold text-gray-450 dark:text-gray-500 uppercase tracking-widest mb-2.5"
            >
              Tags
            </label>
            <input
              type="text"
              id="tags"
              name="tags"
              value={formData.tags}
              onChange={handleChange}
              className="w-full px-4 py-3 text-sm border border-gray-250/70 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-850/40 text-gray-900 dark:text-white rounded-xl focus:outline-none focus:ring-1 focus:ring-gray-300 dark:focus:ring-gray-700 transition-all placeholder-gray-400"
              placeholder="tech, design, writing (comma separated)"
            />
            <p className="text-xs text-gray-400 dark:text-gray-550 mt-2 font-medium">
              Separate your tags with commas to catalog your article.
            </p>
          </div>

          {/* ================= ACTIONS BUTTONS BAR ================= */}
          <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-100 dark:border-gray-800/80">
            <button
              type="button"
              onClick={() => navigate(`/post/${id}`)}
              className="px-5 py-2.5 border border-gray-200 dark:border-gray-750 hover:bg-gray-50 dark:hover:bg-gray-900 rounded-full text-xs font-bold text-gray-650 dark:text-gray-350 transition shadow-sm"
            >
              Cancel Edit
            </button>
            
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 bg-gray-900 dark:bg-gray-100 hover:bg-gray-850 dark:hover:bg-white text-white dark:text-gray-950 rounded-full font-bold text-xs shadow-sm transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Saving modifications...' : 'Save Draft Changes'}
            </button>
          </div>

        </form>
      </main>

      <Footer />
    </div>
  );
};

export default EditPost;