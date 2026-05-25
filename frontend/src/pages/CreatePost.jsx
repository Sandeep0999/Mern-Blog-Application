import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import RichEditor from '../components/RichEditor';
import API from '../api/axios';
import { toast } from 'react-toastify';
import { Upload, X, Sparkles, ArrowLeft, Loader2 } from 'lucide-react';

const CreatePost = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    content: '',
    image: '',
    tags: '',
  });
  const [imagePreview, setImagePreview] = useState('');
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);

  const generateWithAI = async () => {
    if (!formData.title) {
      toast.error('Please enter a title first');
      return;
    }

    setAiLoading(true);

    try {
      const { data } = await API.post('/ai/generate', {
        title: formData.title,
        subtitle: formData.subtitle,
      });

      setFormData((prev) => ({
        ...prev,
        content: data.content,
      }));

      toast.success('AI content generated!');
    } catch (error) {
      toast.error('Failed to generate content');
    } finally {
      setAiLoading(false);
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

    setLoading(true);

    try {
      const tagsArray = formData.tags
        .split(',')
        .map((tag) => tag.trim())
        .filter((tag) => tag);

      const postData = {
        ...formData,
        tags: tagsArray,
      };

      const { data } = await API.post('/posts', postData);
      toast.success('Post created successfully!');
      navigate(`/post/${data._id}`);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create post');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-gray-950 transition-colors duration-300">
      <Navbar />

      <main className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 py-10 animate-fadeIn">
        
        {/* Navigation Breadcrumb */}
        <div className="mb-6 flex items-center justify-between">
          <button
            onClick={() => navigate('/dashboard')}
            className="inline-flex items-center space-x-1 text-xs font-semibold text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Dashboard</span>
          </button>

          {/* AI Drafting button next to standard actions */}
          <button
            type="button"
            onClick={generateWithAI}
            disabled={aiLoading}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-indigo-50/80 dark:bg-indigo-950/40 text-indigo-650 dark:text-indigo-400 text-xs font-semibold rounded-full hover:bg-indigo-100 dark:hover:bg-indigo-950/80 transition-all border border-indigo-100/50 dark:border-indigo-900/60 shadow-sm"
          >
            {aiLoading ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Generating content...</span>
              </>
            ) : (
              <>
                <Sparkles className="h-3.5 w-3.5 fill-current" />
                <span>✨ Write with AI Assistant</span>
              </>
            )}
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
              className="w-full text-3xl sm:text-4xl md:text-5xl font-sans font-black tracking-tight text-gray-900 dark:text-white placeholder-gray-250 dark:placeholder-gray-700 bg-transparent border-none focus:outline-none focus:ring-0 px-0 pb-1 mt-2 leading-tight"
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
              className="w-full text-lg sm:text-xl font-sans font-light text-gray-550 dark:text-gray-400 placeholder-gray-200 dark:placeholder-gray-750 bg-transparent border-none focus:outline-none focus:ring-0 px-0 pb-1 resize-none leading-relaxed"
              placeholder="Write a brief subtitle/description..."
            />
          </div>

          {/* ================= IMAGE BANNER BLOCK ================= */}
          <div>
            <label className="block text-xs font-semibold text-gray-450 dark:text-gray-500 uppercase tracking-widest mb-3">
              Cover Image
            </label>
            {!imagePreview ? (
              <div className="border-2 border-dashed border-gray-250/70 dark:border-gray-800/80 rounded-2xl p-8 text-center hover:border-gray-400 dark:hover:border-gray-700 transition-colors bg-gray-50/30 dark:bg-gray-900/10">
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
              placeholder="e.g. tech, design, writing (comma separated)"
            />
            <p className="text-xs text-gray-400 dark:text-gray-550 mt-2 font-medium">
              Separate your tags with commas to catalog your article.
            </p>
          </div>

          {/* ================= ACTIONS BUTTONS BAR ================= */}
          <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-100 dark:border-gray-800/80">
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="px-5 py-2.5 border border-gray-200 dark:border-gray-750 hover:bg-gray-50 dark:hover:bg-gray-900 rounded-full text-xs font-bold text-gray-600 dark:text-gray-350 transition shadow-sm"
            >
              Cancel Draft
            </button>
            
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-gray-900 dark:bg-gray-100 hover:bg-gray-850 dark:hover:bg-white text-white dark:text-gray-950 rounded-full font-bold text-xs shadow-sm transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Publishing article...' : 'Publish Draft'}
            </button>
          </div>

        </form>
      </main>

      <Footer />
    </div>
  );
};

export default CreatePost;