import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Search, Users, Sparkles } from 'lucide-react';

const Home = () => {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-white to-gray-50">
      <Navbar />

      {/* Hero Section */}
      <section className="flex-1 flex items-center justify-center px-4 py-20">
        <div className="max-w-4xl text-center">
          <h1 className="text-6xl md:text-7xl font-display font-bold text-gray-900 mb-6 leading-tight">
            Write with the best
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed">
            More writers and independent creators choose DailyPen than any other
            writing platform. Tap into intuitive, flexible tools that put writers,
            bloggers, and creators first.
          </p>
          <Link
            to="/signup"
            className="inline-block bg-gray-900 text-white px-8 py-4 rounded-lg text-lg font-medium hover:bg-gray-800 transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            Start a blog
          </Link>
          <p className="text-gray-500 mt-4">
            Get your free account now—just an email needed.
          </p>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {/* Feature 1 */}
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-600 text-white mb-6">
                <Search className="h-8 w-8" />
              </div>
              <h3 className="text-2xl font-display font-semibold mb-4">
                SEO, to go
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Get found faster thanks to built-in search engine optimization
                tools. Clean URLs, automatic sitemaps, and custom titles and
                descriptions help put your blog at the top of the stack in search
                results.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-600 text-white mb-6">
                <Users className="h-8 w-8" />
              </div>
              <h3 className="text-2xl font-display font-semibold mb-4">
                Find your audience
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Say hello to a huge community of bloggers, creators, and avid
                readers, every time you publish. DailyPen's built-in Reader means
                millions of people can easily find, follow, and share your blog.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-600 text-white mb-6">
                <Sparkles className="h-8 w-8" />
              </div>
              <h3 className="text-2xl font-display font-semibold mb-4">
                Blog beautifully
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Customize your blog's look and feel with beautifully designed
                themes. Bring your writing to life with a rich text editor. Put
                your fingerprint on every font, color, and element on the page.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-5xl font-display font-bold text-gray-900 mb-6">
            Simple, meet flexible.
          </h2>
          <p className="text-xl text-gray-600 mb-8 leading-relaxed">
            Whatever you're publishing. Whoever your audience is. DailyPen makes it
            simple to get started. And easy to expand your site as your audience
            grows.
          </p>
          <Link
            to="/signup"
            className="inline-block bg-gray-900 text-white px-8 py-4 rounded-lg text-lg font-medium hover:bg-gray-800 transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            Start a blog
          </Link>
          <p className="text-gray-500 mt-4">
            No coding or design experience required—get your free account in
            minutes.
          </p>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Home;