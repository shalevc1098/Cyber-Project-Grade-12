class User {
    public id: string;
    public firstName: string;
    public lastName: string;
    public username: string;
    public password: string;
    public email: string;
    public phone: string;
    public socketId?: string;

    constructor(id: string, firstName: string, lastName: string, username: string, password: string, email: string, phone: string) {
        this.id = id;
        this.firstName = firstName;
        this.lastName = lastName;
        this.username = username;
        this.password = password;
        this.email = email;
        this.phone = phone;
    }
}

export default User;