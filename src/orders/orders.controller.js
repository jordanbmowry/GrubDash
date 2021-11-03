const path = require('path');

// Use the existing order data
const orders = require(path.resolve('src/data/orders-data'));

// Use this function to assigh ID's when necessary
const nextId = require('../utils/nextId');

// TODO: Implement the /orders handlers needed to make the tests pass

// validation handlers
const validateOrderProperties = (req, res, next) => {
  const { data: { deliverTo, mobileNumber, dishes } = {} } = req.body;

  if (deliverTo === undefined || deliverTo === '') {
    return next({ status: 400, message: 'Order must include a deliverTo' });
  }
  if (mobileNumber === undefined || mobileNumber === '') {
    return next({ status: 400, message: 'Order must include a mobileNumber' });
  }

  if (dishes === undefined) {
    return next({ status: 400, message: 'Order must include a dish' });
  }

  if (!Array.isArray(dishes)) {
    return next({
      status: 400,
      message: 'Order must include at least one dish',
    });
  }

  if (dishes.length === 0) {
    return next({
      status: 400,
      message: 'Order must include at least one dish',
    });
  }

  dishes.forEach((dish, index) => {
    if (
      dish.quantity === undefined ||
      typeof dish.quantity !== 'number' ||
      isNaN(dish.quantity) ||
      dish.quantity <= 0 ||
      !Number.isInteger(dish.quantity)
    ) {
      return next({
        status: 400,
        message: `Dish ${index} must have a quantity that is an integer greater than 0`,
      });
    }
  });

  const newOrder = {
    deliverTo,
    mobileNumber,
    dishes,
  };

  res.locals.newOrder = newOrder;
  next();
};

const validateOrderId = (req, res, next) => {
  const { data: { id } = {} } = req.body;
  const { orderId } = req.params;

  const foundOrder = orders.find((order) => order.id === orderId);
  const index = orders.findIndex((order) => order.id === orderId);
  res.locals.foundOrder = foundOrder;
  res.locals.index = index;
  res.locals.id = orderId;

  if (!foundOrder) {
    next({
      status: 404,
      message: `Order does not exist: ${orderId}`,
    });
  } else if (id) {
    orderId !== id
      ? next({
          status: 400,
          message: `Order id does not match route id. Order: ${id}, Route: ${orderId}`,
        })
      : next();
  } else {
    next();
  }
};

const validateOrderStatus = (req, res, next) => {
  const { data: { status } = {} } = req.body;
  const { status: foundStatus } = res.locals.foundOrder;

  if (!status || status === 'invalid') {
    return next({
      status: 400,
      message:
        'Order must have a status of pending, preparing, out-for-delivery, delivered',
    });
  }
  if (foundStatus === 'delivered') {
    return next({
      status: 400,
      message: 'A delivered order cannot be changed',
    });
  }
  res.locals.changedOrder = req.body.data;
  next();
};

// Route handlers
// POST /orders
const create = (req, res) => {
  const { newOrder } = res.locals;

  const newOrderWithId = { ...newOrder, id: nextId() };

  orders.push(newOrderWithId);
  res.status(201).json({
    data: newOrderWithId,
  });
};
//GET /orders/:orderId
const read = (req, res) => {
  const { foundOrder } = res.locals;
  res.status(200).json({ data: foundOrder });
};

// PUT /orders/:orderId
const update = (req, res) => {
  const { index, id } = res.locals;
  const changedOrder = {
    ...res.locals.changedOrder,
    id,
  };
  orders[index] = changedOrder;

  res.status(200).json({
    data: changedOrder,
  });
};

// DELETE /orders/:orderId
const destroy = (req, res, next) => {
  const { index, foundOrder } = res.locals;
  if (foundOrder.status !== 'pending') {
    return next({
      status: 400,
      message: 'An order cannot be deleted unless it is pending',
    });
  }
  orders.splice(index, 1);
  res.sendStatus(204);
};

// GET /orders
const list = (req, res) => {
  res.status(200).json({
    data: orders,
  });
};

module.exports = {
  create: [validateOrderProperties, create],
  read: [validateOrderId, read],
  update: [
    validateOrderId,
    validateOrderProperties,
    validateOrderStatus,
    update,
  ],
  delete: [validateOrderId, destroy],
  list,
};
