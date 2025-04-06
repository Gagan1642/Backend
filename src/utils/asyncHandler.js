const asyncHandler = (requestHandler) => (req, res, next) => {
  Promise.resolve(requestHandler(req, res, next)).
  catch((err) => next(err));
};

export { asyncHandler };





// Another way to write asyncHandler using try-catch block

// const asyncHandler = () => {}   // Explanation
// const asyncHandler = (fn) => { async () => {}}   // Explanation



// const asyncHandler = (fn) => async (req, res, next) => {
//   try {
//     await fn(req, res, next);
//   } catch (error) {
//     res.status(error.code || 500).json({
//       success: false,
//       message: error.message || 'Internal Server Error',
//     });
//   }
// }
// export { asyncHandler };