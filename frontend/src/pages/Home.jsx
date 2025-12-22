import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import heropic from '../assets/heropic.jpg';

import { Search, Users, Sparkles, PenLine, Globe, Shield } from 'lucide-react';

const Home = () => {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-950">
      <Navbar />

      {/* ================= HERO SECTION ================= */}
<section
  className="relative flex-1 flex items-center justify-center px-4 py-28 bg-cover bg-center"
  style={{
  backgroundImage: `url(${heropic})`,
}}

>
  {/* Overlay */}
  <div className="absolute inset-0 bg-gradient-to-b from-white/40 via-white/55 to-white/70 dark:from-gray-900/40 dark:via-gray-900/60 dark:to-gray-950/80"></div>
  {/* Content */}
  <div className="relative z-10 max-w-5xl text-center animate-fade-in-up">
    <span className="inline-block mb-4 px-4 py-1 text-sm font-medium rounded-full bg-gray-900 text-white shadow-md">
      ✍️ A modern blogging platform
    </span>

    <h1 className="text-6xl md:text-7xl font-display font-bold text-gray-900 dark:text-white mb-6 leading-tight">
      Write smarter. <br className="hidden md:block" />
      Publish faster.
    </h1>

    <p className="text-xl md:text-2xl text-gray-700 dark:text-gray-300 mb-10 max-w-3xl mx-auto leading-relaxed">
      DailyPen helps writers, developers, and creators publish meaningful
      content with powerful tools, beautiful design, and AI assistance.
    </p>

    <div className="flex flex-col sm:flex-row justify-center gap-4">
      <Link
        to="/signup"
        className="bg-gray-900 text-white px-8 py-4 rounded-lg text-lg font-medium hover:bg-gray-800 transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-0.5"
      >
        Start writing for free
      </Link>

      <Link
        to="/login"
        className="px-8 py-4 rounded-lg text-lg font-medium border border-gray-300 dark:border-gray-700 bg-white/80 dark:bg-gray-900/80 text-gray-800 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-800 transition-all duration-300 backdrop-blur"
      >
        Sign in
      </Link>
    </div>

    <p className="text-gray-600 dark:text-gray-400 mt-6">
      No credit card required · Free forever plan
    </p>
  </div>
</section>


      {/* ================= FEATURE GRID ================= */}
      <section className="py-24 px-4 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-display font-bold text-center text-gray-900 dark:text-white mb-16">
            Everything you need to grow your blog
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {[
              {
                icon: <Search />,
                title: 'SEO Ready',
                desc: 'Optimized URLs, metadata, and clean structure help your content rank better.',
              },
              {
                icon: <Users />,
                title: 'Built-in Audience',
                desc: 'Reach readers easily with sharing, discovery, and community features.',
              },
              {
                icon: <Sparkles />,
                title: 'AI-Assisted Writing',
                desc: 'Generate, refine, and expand blog content directly inside the editor.',
              },
              {
                icon: <PenLine />,
                title: 'Rich Editor',
                desc: 'Write beautifully with a distraction-free editor built for long-form content.',
              },
              {
                icon: <Globe />,
                title: 'Fast & Global',
                desc: 'Optimized performance ensures your blogs load fast everywhere.',
              },
              {
                icon: <Shield />,
                title: 'Secure by Default',
                desc: 'Authentication, protected routes, and secure APIs built-in.',
              },
            ].map((item, index) => (
              <div
                key={index}
                className="group bg-gray-50 dark:bg-gray-800 rounded-2xl p-8 text-center border border-gray-200 dark:border-gray-700 transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
              >
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-gray-900 text-white mb-6 group-hover:scale-110 transition-transform">
                  {item.icon}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  {item.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= CTA ================= */}
      <section className="py-24 px-4 bg-gray-50 dark:bg-gray-950">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-5xl font-display font-bold text-gray-900 dark:text-white mb-6">
            Start your writing journey today
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-10 leading-relaxed">
            Whether you're a beginner or a seasoned writer, DailyPen gives you
            the tools to publish confidently and grow consistently.
          </p>
          <Link
            to="/signup"
            className="inline-block bg-gray-900 text-white px-10 py-4 rounded-lg text-lg font-medium hover:bg-gray-800 transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-0.5"
          >
            Create your free account
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Home;
