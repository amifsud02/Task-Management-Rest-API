## Introduction

This API is built following the MVC architecture and is designed to perform CRUD operations related to tasks. 

## How To Use

- clone this reponsitory
- npm i
- npm start
- open postman or any other api testing platforms
- Run these commands to test out the usability of the application

- 

## Endpoints

| Endpoint                                           | Method | Description                                   | Implemented |
| -------------------------------------------------- | ------ | --------------------------------------------- | ----------- |
| `/api/login/`                                   | POST | Login and Generate Bearer Token                       | Yes |
| <center><strong>Task</strong></center>                                               |        |                                               |  |
| `/api/Task/:id`                                    | POST   | Create a new task                             | Yes |
| `/api/Task/`                                       | GET    | Get a list of all tasks                       | Yes |
| `/api/Task/:id`                                    | GET    | Get details of a specific task                | Yes |
| `/api/Task/:id`                                    | PUT    | Update a task                                 | Yes |
| `/api/Task/:id`                                    | DELETE | Delete a task                                 | Yes |

### Breakdown

Model 
- Task: The database model used to create Partial Objects for when Updating a Task.

Controller
- The Controller here handles the incoming requests, performs operations and returns a response. The response can vary between status codes 200, 400, and 500.

## Authentication

The API uses Bearer Token Authentication. Tokens can be acquired by logging in.

## Endpoints

### User Login

#### Login and Generate Bearer Token

- **URL**: `/api/login/`
- **Method**: `POST`
- **Data Params**: 
  - `username=[string]`
  - `password=[string]`
- **Success Response**: 
  - **Code**: `200`
  - **Content**: 
    ```json
    {
      "message": "Logged in Successfully",
      "token": "token_key_here"
    }
    ```
- **Error Response**: 
  - **Code**: `401 Unauthorized`
  - **Content**: 
    ```json
    {
      "error": "Invalid username or password"
    }
    ```

The authentication works by simply signing and verifying the token of the logged in user. I opted for the RSA256 algorithm.  The authentication was only used in selected calls, such as the create, update and delete. 

---

### Tasks

In this rest api i made use of pooling, which showed a massive difference in response times, from 800ms down to 74ms

#### Create a new task

- **URL**: `/api/Task/:id`
- **Method**: `POST`
- **Body Params**: 
  - `title=[string]`
  - `description=[string]`
  - `dueDate=[Date]`
  - `completed=[boolean]`
- **Success Response**: 
  - **Code**: `201`
  - **Content**: 
    ```json
    {
      "success": "boolean",
      "message": {
        "id": "task_id_here",
        "title": "Your Title",
        "description": "Your Description",
        "completed": "boolean"
      }
    }
    ```
  
---

#### Get a list of all tasks

- **URL**: `/api/Task/`
- **Method**: `GET`
- **Success Response**: 
  - **Code**: `200`
  - **Content**: 
    ```json
    [
      {
        "id": "task_id_here",
        "title": "Your Title",
        "description": "Your Description",
        "completed": "boolean"
      },
      {
        "id": "task_id_here",
        "title": "Your Title",
        "description": "Your Description",
        "completed": "boolean"
      }
    ]
    ```

- **Database Connection**: Establishes a MongoDB database connection and gets a reference to the 'tasks' collection.
  
- **Query Parameters**: Reads the following query parameters from the HTTP request.
    - `status`: To filter tasks by their completion status.
    - `sortBy` and `sortOrder`: To sort the tasks.
    - `page` and `limit`: For pagination.

- **Validation**: Validates sorting and pagination parameters, and returns a 400 status code for invalid inputs.
  
- **Database Query**: Fetches tasks based on the constructed query, applies sorting and pagination if applicable.

- **Response**: Sends back the tasks retrieved.

### Code Details:

1. **Query Parameter Parsing**: 
   ```typescript
   let { status, sortBy, sortOrder, page, limit } = req.query;
   ```
  
2. **Status Filtering**: 
    ```typescript
    let parsedStatus = 'true' === status;
    if(parsedStatus !== undefined) {
        query["completed"] = Boolean(parsedStatus);
    }
    ```

3. **Sort Parameter Validation**:
    ```typescript
    if (![1, -1].includes(Number(sortOrder))) {
        return res.status(400).json({ success: false, message: "Invalid Sort Order" });
    }
    sort["sortBy"] = Number(sortOrder) as SortDirection;
    ```
  
4. **Pagination**: 
    ```typescript
    let currentPage = page ? Number(page) : null;
    let currentLimit = limit ? Number(limit) : null;
    ```
    - Also validates the page and limit numbers.

5. **MongoDB Query Execution**: 
    ```typescript
    const tasks = await collection.find(query)
        .skip(numberOfRecordsToSkip)
        .limit(currentLimit)
        .sort(sort)
        .toArray();
    ```

---

#### Get details of a specific task

- **URL**: `/api/Task/:id`
- **Method**: `GET`
- **Success Response**: 
  - **Code**: `200`
  - **Content**: 
    ```json
    {
      "id": "task_id_here",
      "title": "Your Title",
      "description": "Your Description"
    }
    ```
- **ID Validation**: Validates that the `_id` provided in the URL is a valid MongoDB ObjectId.

- **Database Query**: Fetches a single task identified by the provided `_id`.

- **Response**: Sends back the retrieved task as a JSON object.

### Code Details:

1. **Extract _id from URL Parameters**: 
   ```typescript
   const _id  = req.params.id;
   ```

2. **Validate _id**: 
   ```typescript
   if(!ObjectId.isValid(_id)) {
       res.status(400).send('Invalid _id');
       return;
   }
   ```
   Checks if the `_id` is a valid MongoDB ObjectId. If not, it returns a 400 status code with an 'Invalid _id' message.

3. **Fetch Task from Database**: 
    ```typescript
    const task = await collection.findOne({_id: new ObjectId(_id)});
    ```
---

#### Update a task

- **URL**: `/api/Task/:id`
- **Method**: `PUT`
- **Body Params**: 
  - title=[string]
  - description=[string]
  - dueDate=[Date]
  - completed=[boolean]
- **Success Response**: 
  - **Code**: `200`
  - **Content**: 
    ```json
    {
      "id": "task_id_here",
      "title": "Updated Title",
      "description": "Updated Description",
      "dueDate": "Date in ISO Format",
      "completed": "boolean"
    }
    ```
- **ID Validation**: Validates that the `_id` provided in the URL is a valid MongoDB ObjectId.

- **Request Body Validation**: Validates that there are fields in the request body to actually update.

- **Database Update**: Updates the task with the new fields.

- **Response**: Sends back the result of the update as a JSON object.

### Code Details:

1. **Extract _id from URL Parameters**: 
   ```typescript
   const _id  = req.params.id;
   ```

2. **Validate _id**: 
   ```typescript
   if(!ObjectId.isValid(_id)) {
       res.status(400).send('Invalid ID');
       return;
   }
   ```
   Checks if the `_id` is a valid MongoDB ObjectId. If not, it returns a 400 status code with a message.

3. **Extract Update Fields from Request Body**: 
   ```typescript
   const { title, description, dueDate, completed } = req.body;
   ```
   
4. **Validation of Update Fields**: 
    ```typescript
    if(!title && !description && !dueDate && !completed === undefined) {
        res.status(400).send({
            success: false,
            message: 'No Fields to update',
            timestamp: new Date().toISOString(),
        });
        return;
    }
    ```
    Ensures that at least one field to update is present in the request.

5. **Prepare Update Fields**: 
    ```typescript
    const updateFields: Partial<Task> = {};
    // populate updateFields based on the fields present in req.body
    ```
   
6. **Execute Update Operation**: 
   ```typescript
   const result = await collection.updateOne(
       { _id: new ObjectId(_id) }, 
       { $set: updateFields }
   );
   ```
---

#### Delete a task

- **URL**: `/api/task/:id`
- **Method**: `DELETE`
- **Success Response**: 
  - **Code**: `204`
  - **Content**: None

- **Database Connection**: The method establishes a connection to a MongoDB database and fetches a reference to the 'tasks' collection.
  
- **ID Validation**: It checks if the `_id` provided in the request is a valid MongoDB ObjectId.

- **Database Deletion**: Executes a `deleteOne` operation on the MongoDB collection to remove the task identified by `_id`.

### Code Breakdown:

1. **Extract _id from URL Parameters**: 
   ```typescript
   const _id  = req.params.id;
   ```
  
2. **Validate _id**: 
   ```typescript
   if(!ObjectId.isValid(_id)) {
       res.status(400).send('Invalid _id');
       return;
   }
   ```
   If the `_id` is invalid, a 400 status code is returned.
  
3. **Delete Task from Database**: 
   ```typescript
   const task = await collection.deleteOne({_id: new ObjectId(_id)});
   ```
---

### Built With

- Node.js
- Express.js
- TypeScript
- MongoDB
- JSON Web Tokens (JWT) for authentication
