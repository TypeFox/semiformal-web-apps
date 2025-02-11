import ora from 'ora';

class Spinner {
    private spinner = ora();

    start(text: string) {
        this.spinner.start(text);
    }

    stop() {
        this.spinner.stop();
    }

    succeed(text: string) {
        this.spinner.succeed(text);
    }

    fail(text: string) {
        this.spinner.fail(text);
    }
}

export const spinner = new Spinner(); 