film-streaming-mpesa-auth/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── migrations/
│   ├── src/
│   │   ├── config/
│   │   │   └── env.js               # loads env vars (DB, M-Pesa creds)
│   │   ├── controllers/
│   │   │   ├── auth.controller.js   # login, phone verification
│   │   │   ├── payment.controller.js# initiate STK Push, generate link
│   │   │   └── webhook.controller.js# handle M-Pesa callbacks
│   │   ├── services/
│   │   │   ├── mpesa.service.js     # Safaricom API integration
│   │   │   ├── link.service.js      # create/expire access links
│   │   │   └── fraud.service.js     # detect sharing/IP mismatch
│   │   ├── middleware/
│   │   │   ├── auth.middleware.js   # token / session check
│   │   │   └── rateLimit.js         # throttle webhook / login
│   │   ├── models/
│   │   │   └── user.model.js        # Prisma client wrappers (optional)
│   │   ├── routes/
│   │   │   ├── auth.routes.js
│   │   │   ├── payment.routes.js
│   │   │   └── webhook.routes.js
│   │   ├── utils/
│   │   │   ├── uuid.js              # UUIDv4 helper
│   │   │   └── logger.js            # centralized logging
│   │   ├── app.js                   # express app setup
│   │   └── server.js                # start HTTP server
│   ├── .env                          # local environment variables
│   ├── package.json
│   └── README.md
└── frontend/
    ├── (to be defined – e.g. Next.js / React)
    └── …
