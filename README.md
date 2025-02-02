
  
  
  # VS Code Readme Editor 📝  
  Import your existing Readme using the import button at the bottom, 
  or create a new Readme from scratch by typing in the editor.  
  
  ## Get Started 🚀  
  To get started, hit the 'clear' button at the top of the editor!  
  
  ## Prebuilt Components/Templates 🔥  
  You can checkout prebuilt components and templates by clicking on the 'Add Section' button or menu icon
  on the top left corner of the navbar.
      
  ## Save Readme ✨  
  Once you're done, click on the save button to download and save your ReadMe!
  
# FAQ-Backend
A comprehensive guide on tech stack.

## Aim

Acts as a backend service for the faq frontend service.


## Tech Stack  

**Server:** Node , Express   

**Services:** MySQl, AWS RDS, Redis 

**ORM:** Sequelize

**Tools:**  [Detect Language API ](https://detectlanguage.com/), [googletrans](https://github.com/DarinRowe/googletrans)

**Hosting** Redis([Upstash](https://upstash.com/)) , Mysql([AWS RDS](https://aws.amazon.com/rds/))

## Features  

- Multi language Transaltion 
- Caching
- Pre translation
- Language Detection 

## Lessons Learned  

Learned how to use caching.

## Run Locally  

Clone the project  

~~~bash  
  git clone https://github.com/satyamraj1643/faq-backend
~~~

Go to the project directory  

~~~bash  
  cd faq-backend
~~~

You can set up your own .env file like

```
DB_USERNAME=dbname
DB_PASSWORD=yourpassword
DB_HOST=yourhost
DB_PORT=3000

DEV_DB_NAME=devdbname
TEST_DB_NAME=test
PROD_DB_NAME=prod
DIALECT=mysql

REDIS_URL=yourredisurl

```

Install dependencies  

~~~bash  
npm install
~~~

Migrate the models to your DB Instance
~~~bash  
npx sequelize-cli db:migrate
~~~
Start the server  

~~~bash  
npm run dev
~~~

## Environment Variables  

To run this project, you will need to add the following environment variables to your .env file  
`DB_USERNAME`
`DB_PASSWORD`
`DB_HOST`
`DB_PORT`
`DEV_DB_NAME` (for development)
`TEST_DB_NAME` (for testing)
`PROD_DB_NAME` (for production)
`DIALECT`
`REDIS_URL`

Make sure that you have databases created in your DB Instance for database names that you mention in your `.env`  file.





## Acknowledgements  

- [Detect Language API](https://detectlanguage.com/)
- [Awesome README](https://github.com/matiassingers/awesome-readme)
- [Amazon AWS](https://aws.amazon.com/?nc2=h_lg)
- [Redis](https://redis.io/)
- [Upstash](https://upstash.com/)


## Feedback  

If you have any feedback, please reach out to us at satyamraj1643@gmail.com


