const rateLimit=require("express-rate-limit");
const bookingRateLimiter=rateLimit({
 windowMs:60000,limit:10,standardHeaders:"draft-8",legacyHeaders:false,
 message:{success:false,message:"Too many booking requests. Please try again later."}
});
module.exports={bookingRateLimiter};
