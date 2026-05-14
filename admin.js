import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';



const hashedPassword = await bcrypt.hash("admin", 10);
console.log(hashedPassword);


