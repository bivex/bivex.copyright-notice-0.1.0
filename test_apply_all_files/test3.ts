// Test file 3 - TypeScript without copyright
interface User {
    name: string;
    age: number;
}

class UserManager {
    private users: User[] = [];

    addUser(user: User): void {
        this.users.push(user);
        console.log(`Added user: ${user.name}`);
    }

    getUsers(): User[] {
        return this.users;
    }
}

const manager = new UserManager();
manager.addUser({ name: "Alice", age: 30 });