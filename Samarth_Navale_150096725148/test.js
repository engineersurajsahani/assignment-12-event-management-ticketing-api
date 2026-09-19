const request = require('supertest');
const app = require('./server');

const runTests = async () => {
  let passed = 0;
  let total = 0;

  const assert = (condition, name) => {
    total++;
    if (condition) {
      console.log(`PASS: ${name}`);
      passed++;
    } else {
      console.error(`FAIL: ${name}`);
    }
  };

  try {
    const orgReg = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Tech Events',
        email: 'org@events.com',
        password: 'password123',
        role: 'Organizer'
      });
    assert(orgReg.status === 201 && orgReg.body.data.user.role === 'Organizer', 'Auth - Register Organizer');
    const orgToken = orgReg.body.data.token;

    const attReg = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Kunal Sharma',
        email: 'kunal@gmail.com',
        password: 'password123',
        role: 'Attendee'
      });
    assert(attReg.status === 201 && attReg.body.data.user.role === 'Attendee', 'Auth - Register Attendee');
    const attToken = attReg.body.data.token;

    const profileRes = await request(app)
      .get('/api/auth/profile')
      .set('Authorization', `Bearer ${attToken}`);
    assert(profileRes.status === 200 && profileRes.body.data.email === 'kunal@gmail.com', 'Auth - Get Profile');

    const eventsRes = await request(app).get('/api/events?category=Technology&city=Mumbai');
    assert(eventsRes.status === 200 && Array.isArray(eventsRes.body.data), 'Events - Get events list with filters');

    const singleEventRes = await request(app).get('/api/events/event_techconf_2026');
    assert(singleEventRes.status === 200 && singleEventRes.body.data.id === 'event_techconf_2026', 'Events - Get event by ID');

    const newEventRes = await request(app)
      .post('/api/events')
      .set('Authorization', `Bearer ${orgToken}`)
      .send({
        title: 'Backend Workshop 2026',
        description: 'Hands on nodejs',
        category: 'Technology',
        eventDate: '2026-07-20T10:00:00Z',
        venue: 'BKC, Mumbai',
        ticketPrice: 500,
        totalCapacity: 5
      });
    assert(newEventRes.status === 201 && newEventRes.body.data.availableTickets === 5, 'Events - Create event (Organizer)');
    const eventId = newEventRes.body.data.id;

    const forbiddenCreate = await request(app)
      .post('/api/events')
      .set('Authorization', `Bearer ${attToken}`)
      .send({
        title: 'Invalid Event',
        category: 'Tech',
        eventDate: '2026-07-20T10:00:00Z',
        venue: 'Mumbai',
        ticketPrice: 100,
        totalCapacity: 10
      });
    assert(forbiddenCreate.status === 403, 'RBAC - Attendee blocked from creating event');

    const updateEventRes = await request(app)
      .put(`/api/events/${eventId}`)
      .set('Authorization', `Bearer ${orgToken}`)
      .send({ ticketPrice: 600 });
    assert(updateEventRes.status === 200 && updateEventRes.body.data.ticketPrice === 600, 'Events - Update event (Organizer)');

    const bookRes = await request(app)
      .post('/api/tickets/book')
      .set('Authorization', `Bearer ${attToken}`)
      .send({
        eventId,
        quantity: 2,
        attendeeName: 'Kunal Sharma',
        attendeeEmail: 'kunal@gmail.com'
      });
    assert(bookRes.status === 201 && bookRes.body.data.totalPaid === 1200, 'Tickets - Atomic booking');
    const ticketId = bookRes.body.data.id;

    const checkUpdatedEvent = await request(app).get(`/api/events/${eventId}`);
    assert(checkUpdatedEvent.body.data.availableTickets === 3, 'Tickets - Event ticket inventory decremented');

    const oversellRes = await request(app)
      .post('/api/tickets/book')
      .set('Authorization', `Bearer ${attToken}`)
      .send({
        eventId,
        quantity: 10,
        attendeeName: 'Kunal Sharma',
        attendeeEmail: 'kunal@gmail.com'
      });
    assert(oversellRes.status === 400, 'Tickets - Prevent overselling beyond available capacity');

    const myTicketsRes = await request(app)
      .get('/api/tickets/my-tickets')
      .set('Authorization', `Bearer ${attToken}`);
    assert(myTicketsRes.status === 200 && myTicketsRes.body.data.length > 0, 'Tickets - Get my tickets');

    const attendeesRes = await request(app)
      .get(`/api/events/${eventId}/attendees`)
      .set('Authorization', `Bearer ${orgToken}`);
    assert(attendeesRes.status === 200 && attendeesRes.body.count > 0, 'Events - Get event attendees (Organizer)');

    const cancelRes = await request(app)
      .post(`/api/tickets/${ticketId}/cancel`)
      .set('Authorization', `Bearer ${attToken}`);
    assert(cancelRes.status === 200 && cancelRes.body.data.status === 'cancelled', 'Tickets - Cancel ticket');

    const checkRestoredEvent = await request(app).get(`/api/events/${eventId}`);
    assert(checkRestoredEvent.body.data.availableTickets === 5, 'Tickets - Event ticket inventory restored on cancel');

    console.log(`\nTests completed: ${passed}/${total} passed`);
    process.exit(passed === total ? 0 : 1);
  } catch (err) {
    console.error('Test error:', err);
    process.exit(1);
  }
};

runTests();
