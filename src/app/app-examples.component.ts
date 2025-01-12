import { Component } from '@angular/core';
import { UntypedFormBuilder, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';

import {
    Select2Data,
    Select2ScrollEvent,
    Select2SearchEvent,
    Select2UpdateEvent,
} from 'projects/ng-select2-component/src/public_api';

import {
    data1,
    data13,
    data17,
    data18,
    data19,
    data2,
    data22,
    data23,
    data24,
    data26,
    data28,
    data3,
    data5,
    data6,
    data8,
} from './app.data';

@Component({
    selector: 'app-root',
    templateUrl: './app-examples.component.html',
    styleUrls: ['./app-examples.component.scss'],
})
export class AppExamplesComponent {
    data1 = data1;
    data2 = data2;
    data3 = data3;
    data4: Select2Data = JSON.parse(JSON.stringify(data3));
    data5 = data5;
    data6 = data6;
    data7: Select2Data = JSON.parse(JSON.stringify(data3));
    data8: Select2Data = [];
    data9: Select2Data = JSON.parse(JSON.stringify(data1));
    data10: Select2Data = JSON.parse(JSON.stringify(data1));
    data11: Select2Data = JSON.parse(JSON.stringify(data1));
    data12: Select2Data = JSON.parse(JSON.stringify(data1));
    data13 = data13;
    data15 = data2;
    data16 = data2;
    data17 = data17;
    data18 = data18;
    data19 = data19;
    data20: Select2Data = JSON.parse(JSON.stringify(data19));
    data21: Select2Data = JSON.parse(JSON.stringify(data19));
    data22 = data22;
    data23 = data23;
    data24 = data24;
    data25: Select2Data = JSON.parse(JSON.stringify(data23));
    data26 = data26;
    data28 = data28;
    data29: Select2Data = JSON.parse(JSON.stringify(data1));

    minCountForSearch = Infinity;

    ctrlForm: UntypedFormGroup;
    ctrlForm2: UntypedFormGroup;

    value1 = 'CA';
    value2 = 'CA';
    value3 = 'foo';
    value4 = 'bar';
    value5 = 0;
    value6 = 'foo3';
    value7 = '';
    value8 = '';
    value9: string[] = [];
    value10: string[] = [];
    value11 = 'CA';
    value12 = 'CA';
    value13 = true;
    value15 = '';
    value16 = '';
    value17 = '';
    value18 = '';
    value19 = '';
    value20 = '';
    value21 = 'foo6';
    value22 = '';
    value23 = '';
    value24 = '';
    value25 = '';
    value26 = '';
    value28 = '';
    value29: string[] = [];

    limitSelection = 0;

    overlay = false;

    fg: UntypedFormGroup = new UntypedFormGroup({
        state: new UntypedFormControl(),
    });

    constructor(private fb: UntypedFormBuilder) {
        this.ctrlForm = this.fb.group({
            test11: new UntypedFormControl(null, Validators.required),
        });

        this.ctrlForm2 = this.fb.group({
            test5: new UntypedFormControl(0, Validators.required),
        });

        this.fg.patchValue(this.formData());
    }

    addItem() {
        const count = this.data6.length + 1;
        this.data6.push({ value: 'foo' + count, label: 'foo' + count });
    }

    removeItem() {
        this.data6.pop();
    }

    open(key: string, event: Event) {
        console.log(key, event);
    }

    close(key: string, event: Event) {
        console.log(key, event);
    }

    focus(key: string, event: Event) {
        console.log(key, event);
    }

    blur(key: string, event: Event) {
        console.log(key, event);
    }

    change(key: string, event: Event) {
        console.log(key, event);
    }

    search(key: string, event: Select2SearchEvent) {
        console.log(key, event);
    }

    open8() {
        this.data8 = data8;
    }

    close8() {
        alert('close');
    }

    search8(event: Select2SearchEvent) {
        event.filteredData(
            event.search
                ? event.data.filter(option => option.label.toLowerCase().includes(event.search.toLowerCase()))
                : event.data,
        );
    }

    reset11() {
        const test11 = this.ctrlForm.get('test11');
        if (test11) {
            test11.reset();
        }
    }

    change11() {
        const test11 = this.ctrlForm.get('test11');
        if (test11) {
            test11.setValue('UT');
        }
    }

    scroll26(event: Select2ScrollEvent) {
        console.log('scroll26', event);
        if (event.way === 'down' && !event.search) {
            const l = this.data26.length;
            for (let i = 1 + l; i <= 50 + l; i++) {
                this.data26.push({ value: i, label: '>' + i });
            }
        }
    }

    update(key: string, event: Select2UpdateEvent<any>) {
        this[key] = event.value;
    }

    resetForm() {
        this.fg.reset(this.formData());
    }

    print() {
        console.log('FormControl', this.fg.value);
    }

    formData() {
        return {
            state: ['CA', 'NV'],
        };
    }
}
