const { buildSchema } = require('graphql');

module.exports = buildSchema(`
    type Device {
        _id: ID!
        name: String!
        firmware_version: String!
        company: Company!
    }

    type Company {
        _id: ID!
        name: String!
        description: String!
        devices: [Device!]
        created_at: String!
        updated_at: String!
    }

    type User {
        _id: ID!
        email: String!
        password: String
        role: String!
        companies: [Company!]
        isConfirmed: Boolean
    }

    type History {
        _id: ID!
        device: Device!
        adress : String!
        vehicule_status: String!
        gprs_signal: String!
        data_time: String!
        hourmetre: String!
    }

    input AddDeviceInput {
        name: String!
        firmware_version: String!
        company_name: String!
    }

    input AddCompanyInput {
        name: String!
        description: String!
    }

    input AddUserInput {
        email: String!
        password: String!
        role: String!
    }

    type AuthData {
        userId: ID!
        token: String!
        tokenExpiration: Int!
        role: String!
    }

    type Message {
        message: String!
    }

    type StatsDevicePerCompany {
        companyName: String!
        devicesCount: Int!
    }

    type StatsEvolution {
        date: String! 
        count: Int!
    }

    input AddHistoryInput {
        device_id: ID!
        adress: String!
        vehicule_status: String!
        gprs_signal: String!
        data_time: String!
        hourmetre: String!
    }
    
    input UpdateDeviceInput {
        name: String
        firmware_version: String
        company_id: ID
    }

    type DeviceByCompany {
        company: Company!
        devices: [Device!]!
    }

    type ConfirmMessage {
        message: String!
    }

    type RootQuery {
        devices: [Device]
        devicesByRole: [DeviceByCompany!]!
        companies: [Company!]
        users: [User!]
        login(email: String!, password: String!): AuthData!
        histories: [History!] 
        devicesCountPerCompany: [StatsDevicePerCompany!]!
        devicesEvolution(startDate: String!, endDate: String!): [StatsEvolution!]!
        searchDevices(query: String!): [Device!]
        searchCompanies(query: String!): [Company!]
    }

    type RootMutation {
        createDevice(deviceInput: AddDeviceInput!): Device
        createCompany(companyInput: AddCompanyInput!): Company
        createUser(userInput: AddUserInput!): User
        confirmUser(token: String!): ConfirmMessage
        deleteDeviceByName(name: String!): Boolean
        deleteCompany(companyId: ID!): Boolean
        createHistory(historyInput: AddHistoryInput!): History
        updateUserRole(userId: ID!, newRole: String!): User
        requestPasswordReset(email: String!): Message
        resetPassword(token: String!, newPassword: String!): Message
        addCompanyToUser(userId: ID!, companyId: ID!): User!
        removeCompanyFromUser(userId: ID!, companyId: ID!): User
        updateDevice(deviceId: ID!, deviceInput: UpdateDeviceInput!): Device
    }

    schema {
        query: RootQuery
        mutation: RootMutation
    } 
`);
