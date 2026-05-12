import { GraduationCap, Target, Users, Zap } from "lucide-react";

export default function AboutPage() {
  const values = [
    {
      icon: Target,
      title: "Mission-Driven",
      description: "Revolutionizing medical education through AI-powered learning tools tailored for Nigerian medical students.",
    },
    {
      icon: Zap,
      title: "Innovation First",
      description: "Leveraging cutting-edge AI to generate exam questions grounded in actual course materials.",
    },
    {
      icon: Users,
      title: "Student-Centric",
      description: "Built by students, for students. Every feature is designed with your learning journey in mind.",
    },
    {
      icon: GraduationCap,
      title: "Quality Education",
      description: "Committed to maintaining the highest standards of educational content and exam preparation.",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-green-50 py-16 px-4">
      <div className="mx-auto max-w-6xl">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-slate-900 mb-6">About AnatomiQ</h1>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
            AnatomiQ is an AI-powered anatomy learning and exam generation platform designed specifically for
            medical students and faculty at the University of Uyo.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-8 mb-12 shadow-lg">
          <h2 className="text-3xl font-bold text-slate-900 mb-4">Our Story</h2>
          <div className="text-slate-700 space-y-4 leading-relaxed">
            <p>
              Founded in 2026, AnatomiQ was born from a simple observation: medical students needed better,
              more personalized tools to prepare for their anatomy exams. Traditional study methods weren't
              keeping pace with the demands of modern medical education.
            </p>
            <p>
              We built AnatomiQ to bridge that gap. By combining artificial intelligence with pedagogy,
              we create exam questions that are directly grounded in your actual course materials—ensuring
              that every practice session is relevant, accurate, and aligned with your curriculum.
            </p>
            <p>
              Today, AnatomiQ serves hundreds of medical students across multiple disciplines including
              Anatomy, Physiology, Biochemistry, Pharmacology, Pathology, Microbiology, and Law. Our platform
              continues to evolve based on student feedback and the latest advances in educational technology.
            </p>
          </div>
        </div>

        <div className="mb-12">
          <h2 className="text-3xl font-bold text-slate-900 mb-8 text-center">Our Core Values</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {values.map((value) => {
              const Icon = value.icon;
              return (
                <div key={value.title} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-lg">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-blue-100 rounded-lg flex-shrink-0">
                      <Icon className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-slate-900 mb-2">{value.title}</h3>
                      <p className="text-slate-600 leading-relaxed">{value.description}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-600 to-green-600 rounded-2xl p-8 text-center text-white shadow-xl">
          <h2 className="text-3xl font-bold mb-4">Join Thousands of Students</h2>
          <p className="text-lg mb-6 opacity-90">
            Start your journey with AnatomiQ today and experience the future of medical education.
          </p>
          <div className="flex gap-4 justify-center text-center">
            <div className="bg-white/20 backdrop-blur-sm rounded-xl px-6 py-4">
              <div className="text-3xl font-bold">1000+</div>
              <div className="text-sm opacity-90">Active Students</div>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-xl px-6 py-4">
              <div className="text-3xl font-bold">50k+</div>
              <div className="text-sm opacity-90">Questions Generated</div>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-xl px-6 py-4">
              <div className="text-3xl font-bold">7</div>
              <div className="text-sm opacity-90">Courses Available</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
