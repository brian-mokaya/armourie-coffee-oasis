
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const Hero = () => {
  return (
    <section className="relative bg-[url('https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80')] bg-cover bg-center py-32">
      <div className="absolute inset-0 bg-black/60"></div>
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-lg">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4">
            Calm your mind, sip your coffee.
          </h1>
          <p className="text-xl text-white/90 mb-8">
            Experience premium coffee in a relaxing atmosphere at Café Armourié.
          </p>
          <div className="flex flex-wrap gap-4">
            <Button asChild size="lg" className="bg-coffee-dark text-white">
              <Link to="/menu">View Menu</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="bg-white/20 border-white text-white border-2 font-medium hover:bg-white/30">
              <Link to="/about">Learn More</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
