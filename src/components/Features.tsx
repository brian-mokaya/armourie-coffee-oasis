
import { Coffee, Star, Heart, CupSoda } from 'lucide-react';

const Features = () => {
  return (
    <section className="bg-coffee-cream py-16">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-coffee-dark text-center mb-4">
          Why Choose Café Armourié
        </h2>
        <p className="text-center text-coffee-dark/70 max-w-2xl mx-auto mb-12">
          We're dedicated to creating a premium coffee experience that delights your senses and nourishes your soul.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="bg-white p-6 rounded-lg shadow-sm flex flex-col items-center text-center">
            <div className="bg-coffee-light/30 p-4 rounded-full mb-4">
              <Coffee className="h-8 w-8 text-coffee-dark" />
            </div>
            <h3 className="text-xl font-semibold text-coffee-dark mb-3">Premium Beans</h3>
            <p className="text-coffee-dark/70">
              We source only the finest coffee beans from sustainable farms around the world.
            </p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm flex flex-col items-center text-center">
            <div className="bg-coffee-light/30 p-4 rounded-full mb-4">
              <Star className="h-8 w-8 text-coffee-dark" />
            </div>
            <h3 className="text-xl font-semibold text-coffee-dark mb-3">Loyalty Rewards</h3>
            <p className="text-coffee-dark/70">
              Earn points with every purchase and enjoy free drinks and exclusive offers.
            </p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm flex flex-col items-center text-center">
            <div className="bg-coffee-light/30 p-4 rounded-full mb-4">
              <Heart className="h-8 w-8 text-coffee-dark" />
            </div>
            <h3 className="text-xl font-semibold text-coffee-dark mb-3">Crafted with Love</h3>
            <p className="text-coffee-dark/70">
              Our skilled baristas prepare each drink with care and attention to detail.
            </p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm flex flex-col items-center text-center">
            <div className="bg-coffee-light/30 p-4 rounded-full mb-4">
              <CupSoda className="h-8 w-8 text-coffee-dark" />
            </div>
            <h3 className="text-xl font-semibold text-coffee-dark mb-3">Fresh Variety</h3>
            <p className="text-coffee-dark/70">
              From classic espresso to refreshing smoothies, we have something for everyone.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Features;
