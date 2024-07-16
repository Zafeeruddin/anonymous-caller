class PitchShifter extends AudioWorkletProcessor {
    constructor() {
        super();
        this.phase = 0;
    }

    static get parameterDescriptors() {
        return [{
            name: 'pitchFactor',
            defaultValue: 1,
            minValue: 0.5,
            maxValue: 2,
            automationRate: 'k-rate'
        }];
    }

    process(inputs, outputs, parameters) {
        const input = inputs[0];
        const output = outputs[0];
        const pitchFactor = parameters.pitchFactor[0];

        for (let channel = 0; channel < input.length; ++channel) {
            const inputChannel = input[channel];
            const outputChannel = output[channel];

            for (let i = 0; i < inputChannel.length; ++i) {
                this.phase += pitchFactor;
                if (this.phase >= inputChannel.length) {
                    this.phase -= inputChannel.length;
                }
                outputChannel[i] = inputChannel[Math.floor(this.phase)];
            }
        }

        return true;
    }
}

registerProcessor('pitch-shifter', PitchShifter);