"use strict";
class UserManager {
    constructor() {
        this.users = [];
    }
    addUser(user) {
        this.users.push(user);
        console.log(`Added user: ${user.name}`);
    }
    getUsers() {
        return this.users;
    }
}
const manager = new UserManager();
manager.addUser({ name: "Alice", age: 30 });
//# sourceMappingURL=test3.js.map