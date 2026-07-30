const imageByCategory = {
  Hatchback: '/images/vehicles/hatchback.jpg',
  Sedan: '/images/vehicles/sedan.jpg',
  SUV: '/images/vehicles/suv.jpg',
  MUV: '/images/vehicles/muv.jpg',
  EV: '/images/vehicles/ev.jpg',
  Luxury: '/images/vehicles/luxury.jpg',
  Coupe: '/images/vehicles/luxury.jpg',
  Truck: '/images/vehicles/suv.jpg',
  Convertible: '/images/vehicles/luxury.jpg',
  Van: '/images/vehicles/muv.jpg',
};

const getVehicleImage = (category) => imageByCategory[category] || imageByCategory.SUV;

module.exports = { imageByCategory, getVehicleImage };
