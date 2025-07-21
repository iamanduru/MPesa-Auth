mpesa‐gateway/
├── public/                      
│   ├── payment.html            ← “Enter phone → Pay” page
│   ├── stream.html             ← “Watch film” page
│   ├── error.html              ← “Link invalid/used” page
│   ├── css/
│   │   └── styles.css          ← shared styles for these pages
│   └── js/
│       ├── payment.js          ← payment.html logic
│       ├── stream.js           ← stream.html logic
│       └── error.js            ← error.html logic (optional)
├── src/                        
│   ├── controllers/            ← your existing Express controllers
│   ├── routes/                 ← auth, payment, webhook routers
│   └── index.js                ← Express setup, serves API + `public/`
├── .env                        
├── package.json                
└── prisma/                     
    └── schema.prisma           
