export default abstract class WebsocketEvent {
    private readonly opcode: string;

    constructor(opcode: string) {
        this.opcode = opcode;
    }

    getOpcode(): string {
        return this.opcode;
    }

    async exec(event, ws, args) {
        return console.log(`${this.opcode} EXEC`);
    }
}