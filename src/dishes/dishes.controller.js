const path = require('path');

// Use the existing dishes data
const dishes = require(path.resolve('src/data/dishes-data'));

// Use this function to assign ID's when necessary
const nextId = require('../utils/nextId');

// TODO: Implement the /dishes handlers needed to make the tests pass

// validation handlers
const dishHasRequiredProperties = (req, res, next) => {
  const { data: { name, description, price, image_url } = {} } = req.body;

  if (name === undefined || name === '') {
    return next({ status: 400, message: 'Dish must include a name' });
  }
  if (description === undefined || description === '') {
    return next({ status: 400, message: 'Dish must include a description' });
  }
  if (price === undefined) {
    return next({ status: 400, message: 'Dish must include a price' });
  }
  if (price <= 0 || typeof price !== 'number' || Number.isNaN(price)) {
    return next({
      status: 400,
      message: 'Dish must have a price that is an integer greater than 0',
    });
  }
  if (image_url === undefined || image_url === '')
    return next({
      status: 400,
      message: 'Dish must include a image_url',
    });
  const newDish = {
    data: {
      name,
      description,
      price,
      image_url,
    },
  };
  res.locals.newDish = newDish;
  next();
};

const dishHasCorrectId = (req, res, next) => {
  const { data: { id } = {} } = req.body;
  const { dishId } = req.params;
  const foundDish = dishes.find((dish) => dish.id === dishId);
  const index = dishes.findIndex((dish) => dish.id === dishId);
  res.locals.foundDish = foundDish;
  res.locals.index = index;
  res.locals.dishId = dishId;

  if (!foundDish || index === -1) {
    return next({
      status: 404,
      message: `Dish does not exist: ${dishId}`,
    });
  } else if (id) {
    foundDish.id === id
      ? next()
      : next({
          status: 400,
          message: `Dish id does not match route id. Dish: ${id}, Route: ${dishId}`,
        });
  } else {
    next();
  }
};

// Route handlers
// GET /dishes/:dishId
//GET /dishes
const create = (req, res) => {
  const newDishWithId = { ...res.locals.newDish.data, id: nextId() };
  dishes.push(newDishWithId);
  res.status(201).json({ data: newDishWithId });
};

const read = (req, res) => {
  res.status(200).json({ data: res.locals.foundDish });
};

const update = (req, res) => {
  const { index, dishId } = res.locals;
  const {
    data: { id, ...rest },
  } = req.body;

  dishes[index] = { ...rest, id: dishId };
  res.status(200).json({
    data: {
      id: dishId,
      ...rest,
    },
  });
};

// GET /dishes
const list = (req, res) => {
  res.status(200).json({
    data: dishes,
  });
};

module.exports = {
  create: [dishHasRequiredProperties, create],
  read: [dishHasCorrectId, read],
  update: [dishHasRequiredProperties, dishHasCorrectId, update],
  list,
};
