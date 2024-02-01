import triplearrow from '@assets/img/triplearrow.svg';

const HoverArrow = () => {
  return (
    <div className="hover-arrow absolute h-full top-0 left-[-5rem] flex items-center justify-center z-0 transition-transform duration-1000 delay-200 group-hover:translate-x-full">
      <img src={triplearrow} alt="" className="w-full h-20" />
    </div>
  );
};

export { HoverArrow };
