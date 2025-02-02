require('dotenv').config()
const express = require('express')
const cors = require('cors')
const bodyParser = require('body-parser');

const app = express()
app.use(express.json())
app.use(bodyParser.json())
app.use(cors())


const faqRoutes = require("./routes/faqRoutes");


app.get('/', (req, res) => {
  res.json({ message: 'Server is running!' })
})

app.use('/api/faqs', faqRoutes);


const PORT = process.env.PORT || 5000
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`)
})
