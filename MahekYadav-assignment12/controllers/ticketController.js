const {db}=require("../config/firebaseConfig");
const bookingRef=()=>`TKT-${Date.now().toString().slice(-6)}-${Math.floor(100+Math.random()*900)}`;
exports.bookTicket=async(req,res)=>{
 const {eventId,quantity,attendeeName,attendeeEmail}=req.body,qty=Number.parseInt(quantity,10);
 if(!eventId||!Number.isInteger(qty)||qty<1||qty>10)return res.status(400).json({success:false,message:"eventId and quantity (1-10) are required."});
 if(!attendeeName||!attendeeEmail)return res.status(400).json({success:false,message:"attendeeName and attendeeEmail are required."});
 const er=db.collection("events").doc(eventId),tr=db.collection("tickets").doc();
 try{
  const result=await db.runTransaction(async t=>{
   const ed=await t.get(er);if(!ed.exists)throw new Error("Event not found.");
   const e=ed.data();if(new Date(e.eventDate)<=new Date())throw new Error("Tickets cannot be booked for a completed event.");
   if(e.availableTickets<qty)throw new Error("Insufficient tickets available.");
   const ticket={id:tr.id,eventId,eventTitle:e.title,userId:req.user.id,attendeeName:attendeeName.trim(),attendeeEmail:attendeeEmail.trim().toLowerCase(),quantity:qty,totalPaid:qty*Number(e.ticketPrice),bookingRef:bookingRef(),status:"confirmed",bookedAt:new Date().toISOString()};
   t.update(er,{availableTickets:e.availableTickets-qty});t.set(tr,ticket);return ticket;
  });
  res.status(201).json({success:true,message:"Tickets booked successfully.",data:result});
 }catch(e){console.error(e);res.status(400).json({success:false,message:e.message||"Booking failed."});}
};
exports.getMyTickets=async(req,res)=>{
 try{const s=await db.collection("tickets").where("userId","==",req.user.id).get();res.json({success:true,count:s.size,data:s.docs.map(x=>({id:x.id,...x.data()}))});}
 catch(e){res.status(500).json({success:false,message:"Could not load tickets."});}
};
exports.cancelTicket=async(req,res)=>{
 try{
  const tr=db.collection("tickets").doc(req.params.id),td=await tr.get();if(!td.exists)return res.status(404).json({success:false,message:"Ticket not found."});
  if(td.data().userId!==req.user.id)return res.status(403).json({success:false,message:"You can only cancel your own tickets."});
  const er=db.collection("events").doc(td.data().eventId);
  await db.runTransaction(async t=>{
   const [ticket,event]=await Promise.all([t.get(tr),t.get(er)]);if(!ticket.exists||!event.exists)throw new Error("Ticket or event not found.");
   const x=ticket.data(),e=event.data();if(x.status==="cancelled")throw new Error("Ticket is already cancelled.");
   t.update(tr,{status:"cancelled",cancelledAt:new Date().toISOString()});t.update(er,{availableTickets:Number(e.availableTickets)+Number(x.quantity)});
  });
  res.json({success:true,message:"Ticket cancelled and inventory restored."});
 }catch(e){res.status(400).json({success:false,message:e.message||"Could not cancel ticket."});}
};
