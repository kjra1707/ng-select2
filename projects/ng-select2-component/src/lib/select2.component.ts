import {
    CdkConnectedOverlay,
    ConnectedOverlayPositionChange,
    ConnectedPosition,
    VerticalConnectionPos,
} from '@angular/cdk/overlay';
import { ViewportRuler } from '@angular/cdk/scrolling';
import type { ElementRef, QueryList } from '@angular/core';
import {
    AfterViewInit,
    Attribute,
    ChangeDetectorRef,
    Component,
    DoCheck,
    EventEmitter,
    HostBinding,
    Input,
    OnDestroy,
    OnInit,
    Optional,
    Output,
    Self,
    TemplateRef,
    ViewChild,
    ViewChildren,
} from '@angular/core';
import { ControlValueAccessor, FormGroupDirective, NgControl, NgForm } from '@angular/forms';

import { Subject } from 'rxjs';

import { coerceBooleanProperty, coerceNumberProperty } from '@angular/cdk/coercion';
import { timeout } from './select2-const';
import {
    Select2Data,
    Select2Group,
    Select2Option,
    Select2RemoveEvent,
    Select2ScrollEvent,
    Select2SearchEvent,
    Select2UpdateEvent,
    Select2UpdateValue,
    Select2Value,
} from './select2-interfaces';
import { Select2Utils } from './select2-utils';

let nextUniqueId = 0;

const displaySearchStatusList = ['default', 'hidden', 'always'];

@Component({
    selector: 'select2',
    templateUrl: './select2.component.html',
    styleUrls: ['./select2.component.scss'],
})
export class Select2 implements ControlValueAccessor, OnInit, OnDestroy, DoCheck, AfterViewInit {
    _data: Select2Data;

    /** data of options & optiongrps */
    @Input({ required: true }) set data(data: Select2Data) {
        this._data = data;
        this.updateFilteredData();
    }
    @Input() minCharForSearch = 0;
    @Input() displaySearchStatus: 'default' | 'hidden' | 'always';
    @Input() placeholder: string;

    @Input() limitSelection = 0;
    @Input() listPosition: 'above' | 'below' | 'auto' = 'below';

    @Input()
    get multiple(): any {
        return this._multiple;
    }
    set multiple(value: any) {
        this._multiple = coerceBooleanProperty(value);
        this.ngOnInit();
    }

    /** use the material style */
    @Input()
    get overlay(): any {
        return this._overlay;
    }
    set overlay(value: any) {
        this._overlay = coerceBooleanProperty(value);
    }

    /** use the material style */
    @Input() styleMode: 'material' | 'noStyle' | 'default' = 'default';

    /** message when no result */
    @Input() noResultMessage: string;

    /** maximum results limit (0 = no limit) */
    @Input() maxResults = 0;

    /** message when maximum results */
    @Input() maxResultsMessage = 'Too many results…';

    /** infinite scroll distance */
    @Input() infiniteScrollDistance = 1.5;

    /** infinite scroll distance */
    @Input() infiniteScrollThrottle = 150;

    /** infinite scroll activated */
    @Input()
    get infiniteScroll(): any {
        return this._infiniteScroll;
    }
    set infiniteScroll(value: any) {
        this._infiniteScroll = coerceBooleanProperty(value);
    }

    /** auto create if not existe */
    @Input()
    get autoCreate(): any {
        return this._autoCreate;
    }
    set autoCreate(value: any) {
        this._autoCreate = coerceBooleanProperty(value);
    }

    /** no template for label selection */
    @Input()
    get noLabelTemplate(): any {
        return this._noLabelTemplate;
    }
    set noLabelTemplate(value: any) {
        this._noLabelTemplate = coerceBooleanProperty(value);
    }

    /** use it for change the pattern of the filter search */
    @Input() editPattern: (str: string) => string;

    /** template for formating */
    @Input() templates: TemplateRef<any> | { [key: string]: TemplateRef<any> };

    /** the max height of the results container when opening the select */
    @Input() resultMaxHeight = '200px';

    @Output() update = new EventEmitter<Select2UpdateEvent<Select2UpdateValue>>();
    @Output() open = new EventEmitter<Select2>();
    @Output() close = new EventEmitter<Select2>();
    @Output() focus = new EventEmitter<Select2>();
    @Output() blur = new EventEmitter<Select2>();
    @Output() search = new EventEmitter<Select2SearchEvent<Select2UpdateValue>>();
    @Output() scroll = new EventEmitter<Select2ScrollEvent>();
    @Output() removeOption = new EventEmitter<Select2RemoveEvent<Select2UpdateValue>>();

    option: Select2Option | Select2Option[] | null = null;
    isOpen = false;
    searchStyle: string;

    /** Whether the element is focused or not. */
    focused = false;

    filteredData: Select2Data;

    get select2Options() {
        return this.multiple ? (this.option as Select2Option[]) : null;
    }

    get select2Option() {
        return this.multiple ? null : (this.option as Select2Option);
    }

    get searchText() {
        return this.innerSearchText;
    }

    set searchText(text: string) {
        this.innerSearchText = text;
    }

    /** Active Search event */
    @Input()
    public get customSearchEnabled(): boolean {
        return this._customSearchEnabled;
    }
    public set customSearchEnabled(value: boolean) {
        this._customSearchEnabled = coerceBooleanProperty(value);
    }

    /** minimal data of show the search field */
    @Input()
    get minCountForSearch(): number | string {
        return this._minCountForSearch;
    }

    set minCountForSearch(value: number | string) {
        this._minCountForSearch = coerceNumberProperty(value);
        this.updateSearchBox();
    }

    /** Unique id of the element. */
    @Input()
    @HostBinding('id')
    get id() {
        return this._id;
    }
    set id(value: string) {
        this._id = value || this._uid;
    }

    /** Whether the element is required. */
    @Input()
    get required() {
        return this._required;
    }
    set required(value: any) {
        this._required = coerceBooleanProperty(value);
    }

    /** Whether selected items should be hidden. */
    @Input()
    get disabled() {
        return this._control ? this._control.disabled : this._disabled;
    }
    set disabled(value: any) {
        this._disabled = coerceBooleanProperty(value);
    }

    /** Whether items are hidden when has. */
    @Input()
    get hideSelectedItems() {
        return this._hideSelectedItems;
    }
    set hideSelectedItems(value: any) {
        this._hideSelectedItems = coerceBooleanProperty(value);
    }

    /** Whether the element is readonly. */
    @Input()
    get readonly() {
        return this._readonly;
    }
    set readonly(value: any) {
        this._readonly = coerceBooleanProperty(value);
    }

    /** The input element's value. */
    @Input()
    get value() {
        return this._value;
    }
    set value(value: Select2UpdateValue) {
        if (this.testValueChange(this._value, value)) {
            setTimeout(() => {
                this._value = value;
                this.writeValue(value);
            }, 10);
        }
    }

    /** Tab index for the select2 element. */
    @Input()
    get tabIndex(): number {
        return this.disabled ? -1 : this._tabIndex;
    }
    set tabIndex(value: number) {
        if (typeof value !== 'undefined') {
            this._tabIndex = value;
        }
    }

    /** reset with no selected value */
    @Input()
    get resettable() {
        return this._resettable;
    }
    set resettable(value: any) {
        this._resettable = coerceBooleanProperty(value);
    }

    @HostBinding('attr.aria-invalid')
    get ariaInvalid(): boolean {
        return this._isErrorState();
    }

    @HostBinding('class.material')
    get classMaterial(): boolean {
        return this.styleMode === 'material';
    }

    @HostBinding('class.nostyle')
    get classNostyle(): boolean {
        return this.styleMode === 'noStyle';
    }

    @HostBinding('class.select2-above')
    get select2above(): boolean {
        return !this.overlay ? this.listPosition === 'above' : this._isAbobeOverlay();
    }

    overlayWidth: number;
    overlayHeight: number;
    _triggerRect: DOMRect;
    _dropdownRect: DOMRect;

    get _positions(): ConnectedPosition[] {
        return this.listPosition === 'auto' ? undefined : null;
    }

    maxResultsExceeded: boolean;

    private _customSearchEnabled: boolean;
    private _minCountForSearch?: number | string;

    @ViewChild(CdkConnectedOverlay) private cdkConnectedOverlay: CdkConnectedOverlay;
    @ViewChild('selection', { static: true }) private selection: ElementRef<HTMLElement>;
    @ViewChild('results') private resultContainer: ElementRef<HTMLElement>;
    @ViewChildren('result') private results: QueryList<ElementRef>;
    @ViewChild('searchInput') private searchInput: ElementRef<HTMLElement>;
    @ViewChild('dropdown') private dropdown: ElementRef<HTMLElement>;

    private hoveringValue: Select2Value | null | undefined = null;
    private innerSearchText = '';
    private isSearchboxHidden: boolean;

    private selectionElement: HTMLElement;

    private get resultsElement(): HTMLElement {
        return this.resultContainer?.nativeElement;
    }

    private _stateChanges = new Subject<void>();

    /** Tab index for the element. */
    private _tabIndex: number;

    private _disabled = false;
    private _required = false;
    private _readonly = false;
    private _multiple = false;
    private _overlay = false;
    private _resettable = false;
    private _hideSelectedItems = false;
    private _clickDetection = false;
    private _clickDetectionFc: (e: MouseEvent) => void;
    private _id: string;
    private _uid = `select2-${nextUniqueId++}`;
    private _value: Select2UpdateValue;
    private _previousNativeValue: Select2UpdateValue;
    private _infiniteScroll = true;
    private _autoCreate = true;
    private _noLabelTemplate = true;
    private _overlayPosition: VerticalConnectionPos;

    constructor(
        protected _viewportRuler: ViewportRuler,
        private _changeDetectorRef: ChangeDetectorRef,
        @Optional() private _parentForm: NgForm,
        @Optional() private _parentFormGroup: FormGroupDirective,
        @Self() @Optional() public _control: NgControl,
        @Attribute('tabindex') tabIndex: string,
    ) {
        // eslint-disable-next-line no-self-assign
        this.id = this.id;
        this._tabIndex = parseInt(tabIndex, 10) || 0;

        if (this._control) {
            this._control.valueAccessor = this;
        }

        this._clickDetectionFc = this.clickDetection.bind(this);
    }

    /** View -> model callback called when select has been touched */
    private _onTouched = () => {
        // do nothing
    };

    /** View -> model callback called when value changes */
    private _onChange: (value: any) => void = () => {
        // do nothing
    };

    ngOnInit() {
        this._viewportRuler.change(100).subscribe(() => {
            if (this.isOpen) {
                this.triggerRect();
            }
        });

        const option = Select2Utils.getOptionsByValue(
            this._data,
            this._control ? this._control.value : this.value,
            this.multiple,
        );
        if (option !== null) {
            this.option = option;
        }
        if (!Array.isArray(option)) {
            this.hoveringValue = this.value as string | undefined;
        }
        this.updateSearchBox();
    }

    ngAfterViewInit() {
        this.cdkConnectedOverlay.positionChange.subscribe((posChange: ConnectedOverlayPositionChange) => {
            if (
                this.listPosition === 'auto' &&
                posChange.connectionPair?.originY &&
                this._overlayPosition !== posChange.connectionPair.originY
            ) {
                this.triggerRect();
                this._overlayPosition = posChange.connectionPair.originY;
                this._changeDetectorRef.detectChanges();
            }
        });

        this.selectionElement = this.selection.nativeElement;
        this.triggerRect();
    }

    ngDoCheck() {
        this.updateSearchBox();
        this._dirtyCheckNativeValue();
        if (this._triggerRect) {
            if (this.overlayWidth !== this._triggerRect.width) {
                this.overlayWidth = this._triggerRect.width;
            }
            if (this._dropdownRect?.height > 0 && this.overlayHeight !== this._dropdownRect.height) {
                this.overlayHeight = this.listPosition === 'auto' ? this._dropdownRect.height : 0;
            }
        }
    }

    ngOnDestroy() {
        window.document.body.removeEventListener('click', this._clickDetectionFc);
    }

    updateSearchBox() {
        const hidden = this.customSearchEnabled
            ? false
            : Select2Utils.isSearchboxHiddex(this._data, this._minCountForSearch);
        if (this.isSearchboxHidden !== hidden) {
            this.isSearchboxHidden = hidden;
        }
    }

    hideSearch(): boolean {
        const displaySearchStatus =
            displaySearchStatusList.indexOf(this.displaySearchStatus) > -1 ? this.displaySearchStatus : 'default';
        return (displaySearchStatus === 'default' && this.isSearchboxHidden) || displaySearchStatus === 'hidden';
    }

    getOptionStyle(option: Select2Option) {
        return (
            'select2-results__option ' +
            (option.hide ? 'select2-results__option--hide ' : '') +
            (option.value === this.hoveringValue ? 'select2-results__option--highlighted ' : '') +
            (option.classes || '')
        );
    }

    mouseenter(option: Select2Option) {
        if (!option.disabled) {
            this.hoveringValue = option.value;
        }
    }

    click(option: Select2Option) {
        if (this.testSelection(option)) {
            this.select(option);
        }
    }

    reset(event: MouseEvent) {
        this.select(null);
        this.stopEvent(event);
    }

    prevChange(event: Event) {
        event.stopPropagation();
    }

    stopEvent(event: Event) {
        event.preventDefault();
        event.stopPropagation();
    }

    toggleOpenAndClose(focus = true, open?: boolean) {
        if (this.disabled) {
            return;
        }
        this._focus(focus);
        this.isOpen = open ?? !this.isOpen;

        if (this.isOpen) {
            this.innerSearchText = '';
            this.updateFilteredData();
            this._focusSearchboxOrResultsElement(focus);

            setTimeout(() => {
                if (this.option) {
                    const option: Select2Option = this.option instanceof Array ? this.option[0] : this.option;
                    this.updateScrollFromOption(option);
                } else if (this.resultsElement) {
                    this.resultsElement.scrollTop = 0;
                }
                setTimeout(() => {
                    this.triggerRect();
                    this.cdkConnectedOverlay?.overlayRef?.updatePosition();
                }, 100);
            });
            this.open.emit(this);
        } else {
            this.close.emit(this);
        }

        if (this.isOpen && !this._clickDetection && focus) {
            setTimeout(() => {
                window.document.body.addEventListener('click', this._clickDetectionFc, false);
                this._clickDetection = true;
            }, timeout);
        }

        this._changeDetectorRef.markForCheck();
    }

    hasTemplate(option: Select2Option | Select2Group, defaut: string) {
        return (
            this.templates instanceof TemplateRef ||
            this.templates?.[option.templateId] instanceof TemplateRef ||
            this.templates?.[defaut] instanceof TemplateRef
        );
    }

    getTemplate(option: Select2Option | Select2Group, defaut: string) {
        return this.hasTemplate(option, defaut)
            ? this.templates[option.templateId] || this.templates[defaut] || this.templates
            : undefined;
    }

    triggerRect() {
        this._triggerRect = this.selectionElement.getBoundingClientRect();
        this._dropdownRect = this.dropdown?.nativeElement
            ? this.dropdown.nativeElement.getBoundingClientRect()
            : undefined;
    }

    private testSelection(option: Select2Option) {
        if (option.disabled) {
            return false;
        }

        return (
            !this.multiple ||
            !this.limitSelection ||
            (Array.isArray(this._value) && this._value.length < this.limitSelection)
        );
    }

    private testValueChange(value1: Select2UpdateValue, value2: Select2UpdateValue) {
        if (
            ((value1 === null || value1 === undefined) && (value2 === null || value2 === undefined)) ||
            value1 === value2
        ) {
            return false;
        }
        if (
            this.multiple &&
            (value1 as Select2Value[])?.length &&
            (value2 as Select2Value[])?.length &&
            (value1 as Select2Value[]).length === (value2 as Select2Value[]).length
        ) {
            for (const e1 of value1 as Select2Value[]) {
                const test = (value2 as Select2Value[]).indexOf(e1) > -1;
                if (!test) {
                    return true;
                }
            }
            return false;
        }
        return true;
    }

    private updateFilteredData() {
        setTimeout(() => {
            let result = this._data;
            if (this.multiple && this.hideSelectedItems) {
                result = Select2Utils.getFilteredSelectedData(result, this.option);
            }

            if (!this.customSearchEnabled && this.searchText && this.searchText.length >= +this.minCharForSearch) {
                result = Select2Utils.getFilteredData(result, this.searchText, this.editPattern);
            }

            if (this.maxResults > 0) {
                const data = Select2Utils.getReduceData(result, +this.maxResults);
                result = data.result;
                this.maxResultsExceeded = data.reduce;
            } else {
                this.maxResultsExceeded = false;
            }

            if (Select2Utils.valueIsNotInFilteredData(result, this.hoveringValue)) {
                this.hoveringValue = Select2Utils.getFirstAvailableOption(result);
            }

            this.filteredData = result;
            this._changeDetectorRef.markForCheck();
        });
    }

    private clickDetection(e: MouseEvent) {
        if (!this.ifParentContainsClass(e.target as HTMLElement, 'selection')) {
            if (this.isOpen && !this.ifParentContainsClass(e.target as HTMLElement, 'select2-dropdown')) {
                this.toggleOpenAndClose();
            }
            if (!this.ifParentContainsId(e.target as HTMLElement, this._id)) {
                this.clickExit();
            }
        } else if (this.isOpen && !this.ifParentContainsId(e.target as HTMLElement, this._id)) {
            this.toggleOpenAndClose();
            this.clickExit();
        }
    }

    private clickExit() {
        this._focus(false);
        window.document.body.removeEventListener('click', this._clickDetectionFc);
        this._clickDetection = false;
    }

    private ifParentContainsClass(element: HTMLElement, cssClass: string): boolean {
        return this.getParentElementByClass(element, cssClass) !== null;
    }

    private ifParentContainsId(element: HTMLElement, id: string): boolean {
        return this.getParentElementById(element, id) !== null;
    }

    private getParentElementByClass(element: HTMLElement, cssClass: string): HTMLElement | null {
        return this.containClasses(element, cssClass.trim().split(/\s+/))
            ? element
            : element.parentElement
            ? this.getParentElementByClass(element.parentElement, cssClass)
            : null;
    }

    private getParentElementById(element: HTMLElement, id: string): HTMLElement | null {
        return element.id === id
            ? element
            : element.parentElement
            ? this.getParentElementById(element.parentElement, id)
            : null;
    }

    private containClasses(element: HTMLElement, cssClasses: string[]): boolean {
        if (!element.classList) {
            return false;
        }
        for (const cssClass of cssClasses) {
            if (!element.classList.contains(cssClass)) {
                return false;
            }
        }
        return true;
    }

    focusin() {
        if (!this.disabled) {
            this._focus(true);
        }
    }

    focusout() {
        if (this.selectionElement && !this.selectionElement.classList.contains('select2-focused')) {
            this._focus(false);
            this._onTouched();
        }
    }

    select(option: Select2Option | null) {
        let value: any;
        if (option !== null) {
            if (this.multiple) {
                const options = this.option as Select2Option[];
                const index = options.findIndex(op => op.value === option.value);
                if (index === -1) {
                    options.push(option);
                } else {
                    options.splice(index, 1);
                }
                value = (this.option as Select2Option[]).map(op => op.value);
            } else {
                this.option = option;
                if (this.isOpen) {
                    this.isOpen = false;
                    this.close.emit(this);
                    this.selectionElement?.focus();
                }
                value = this.option.value;
            }
        } else {
            this.option = null;
        }

        if (this.multiple && this.hideSelectedItems) {
            this.updateFilteredData();
        }

        if (this._control) {
            this._onChange(value);
        } else {
            this._value = value;
        }

        this.update.emit({
            component: this,
            value: value,
            options: Array.isArray(this.option) ? this.option : this.option ? [this.option] : null,
        });
    }

    keyDown(e: KeyboardEvent, create = false) {
        if (create && this._testKey(e, ['Enter', 13])) {
            this.createAndAdd(e);
            return;
        }
        if (this._testKey(e, ['ArrowDown', 40])) {
            this.moveDown();
            e.preventDefault();
        } else if (this._testKey(e, ['ArrowUp', 38])) {
            this.moveUp();
            e.preventDefault();
        } else if (this._testKey(e, ['Enter', 13])) {
            this.selectByEnter();
            e.preventDefault();
        } else if (this._testKey(e, ['Escape', 'Tab', 9, 27]) && this.isOpen) {
            this.toggleOpenAndClose();
            this._focus(false);
        }
    }

    openKey(e: KeyboardEvent, create = false) {
        if (create && this._testKey(e, ['Enter', 13])) {
            this.createAndAdd(e);
            return;
        }
        if (this._testKey(e, ['ArrowDown', 'ArrowUp', 'Enter', 40, 38, 13])) {
            this.toggleOpenAndClose();
            e.preventDefault();
        } else if (this._testKey(e, ['Escape', 'Tab', 9, 27])) {
            this._focus(false);
            this._onTouched();
        }
    }

    searchUpdate(e: Event) {
        this.searchText = (e.target as HTMLInputElement).value;
        if (!this._customSearchEnabled) {
            this.updateFilteredData();
        } else {
            this.search.emit({
                component: this,
                value: this._value,
                search: this.searchText,
                data: this._data,
                filteredData: (data: Select2Data) => {
                    this.filteredData = data;
                    this._changeDetectorRef.markForCheck();
                },
            });
        }
    }

    trackBy(_index: number, item: Select2Option): any {
        return item.value;
    }

    isSelected(option: Select2Option) {
        return Select2Utils.isSelected(this.option, option, this.multiple);
    }

    isDisabled(option: Select2Option) {
        return option.disabled ? 'true' : 'false';
    }

    removeSelection(e: MouseEvent | KeyboardEvent, option: Select2Option) {
        Select2Utils.removeSelection(this.option, option);

        if (this.multiple && this.hideSelectedItems) {
            this.updateFilteredData();
        }

        const value = (this.option as Select2Option[]).map(op => op.value);

        if (this._control) {
            this._onChange(value);
        } else {
            this._value = value;
        }

        this.update.emit({
            component: this,
            value: value,
            options: Array.isArray(this.option) ? this.option : this.option ? [this.option] : null,
        });
        this.removeOption.emit({
            component: this,
            value: value,
            removedOption: option,
        });

        e.preventDefault();
        e.stopPropagation();

        if (this.isOpen) {
            this._focusSearchboxOrResultsElement();
        }
    }

    /**
     * Sets the model value. Implemented as part of ControlValueAccessor.
     * @param value
     */
    writeValue(value: any) {
        this._setSelectionByValue(value);
    }

    /**
     * Saves a callback function to be invoked when the select's value
     * changes from user input. Part of the ControlValueAccessor interface
     * required to integrate with Angular's core forms API.
     *
     * @param fn Callback to be triggered when the value changes.
     */
    registerOnChange(fn: (value: any) => void): void {
        this._onChange = fn;
    }

    /**
     * Saves a callback function to be invoked when the select is blurred
     * by the user. Part of the ControlValueAccessor interface required
     * to integrate with Angular's core forms API.
     *
     * @param fn Callback to be triggered when the component has been touched.
     */
    registerOnTouched(fn: () => {}): void {
        this._onTouched = fn;
    }

    /**
     * Sets whether the component should be disabled.
     * Implemented as part of ControlValueAccessor.
     * @param isDisabled
     */
    setDisabledState(isDisabled: boolean) {
        this.disabled = isDisabled;
    }

    onScroll(way: 'up' | 'down') {
        this.scroll.emit({
            component: this,
            way,
            search: this.innerSearchText,
            data: this._data,
        });
    }

    _isErrorState(): boolean {
        const isInvalid = this._control?.invalid;
        const isTouched = this._control?.touched;
        const isSubmitted = this._parentFormGroup?.submitted || this._parentForm?.submitted;
        return !!(isInvalid && (isTouched || isSubmitted));
    }

    private addItem(value: string): Select2Option {
        let item = Select2Utils.getOptionByValue(this._data, value);
        if (!item) {
            item = {
                value,
                label: value,
            };
            this._data.push(item);
        }
        return item;
    }

    private createAndAdd(e: KeyboardEvent) {
        const value = (e.target as HTMLInputElement).value;
        if (value.trim()) {
            const item = this.addItem(value.trim());
            this.click(item);
            (e.target as HTMLInputElement).value = '';
        }
        this.stopEvent(e);
    }

    private moveUp() {
        this.updateScrollFromOption(Select2Utils.getPreviousOption(this.filteredData, this.hoveringValue));
    }

    private moveDown() {
        this.updateScrollFromOption(Select2Utils.getNextOption(this.filteredData, this.hoveringValue));
    }

    private updateScrollFromOption(option: Select2Option) {
        if (option) {
            this.hoveringValue = option.value;
            const domElement = this.results.find(r => r.nativeElement.innerText.trim() === option.label);
            if (domElement && this.resultsElement) {
                this.resultsElement.scrollTop = 0;
                const listClientRect = this.resultsElement.getBoundingClientRect();
                const optionClientRect = domElement.nativeElement.getBoundingClientRect();
                this.resultsElement.scrollTop = optionClientRect.top - listClientRect.top;
            }
        }
    }

    private selectByEnter() {
        if (this.hoveringValue) {
            const option = Select2Utils.getOptionByValue(this._data, this.hoveringValue);
            this.select(option);
        }
    }

    private _testKey(event: KeyboardEvent, refs: (number | string)[] = []): boolean {
        return this._isKey(this._getKey(event), refs);
    }

    private _getKey(event: KeyboardEvent): number | string {
        let code: number | string;

        if (event.key !== undefined) {
            code = event.key;
        } else if (event['keyIdentifier'] !== undefined) {
            code = event['keyIdentifier'];
        } else if (event['keyCode'] !== undefined) {
            code = event['keyCode'];
        } else {
            event.preventDefault();
        }

        return code;
    }

    private _isKey(code: number | string, refs: (number | string)[] = []): boolean {
        return refs && refs.length > 0 ? refs.indexOf(code) !== -1 : false;
    }

    /**
     * Sets the selected option based on a value. If no option can be
     * found with the designated value, the select trigger is cleared.
     */
    private _setSelectionByValue(value: any | any[]): void {
        if (this.option || (value !== undefined && value !== null)) {
            const isArray = Array.isArray(value);
            if (this.multiple && value && !isArray) {
                throw new Error('Non array value.');
            } else if (this._data) {
                if (this.multiple) {
                    this.option = []; // if value is null, then empty option and return
                    if (isArray) {
                        // value is not null. Preselect value
                        const selectedValues: any = Select2Utils.getOptionsByValue(this._data, value, this.multiple);
                        selectedValues.map(item => this.select(item));
                    }
                } else {
                    this.select(Select2Utils.getOptionByValue(this._data, value));
                }
            } else if (this._control) {
                this._control.viewToModelUpdate(value);
            }

            this._changeDetectorRef.markForCheck();
        }
    }

    /** Does some manual dirty checking on the native input `value` property. */
    private _dirtyCheckNativeValue() {
        const newValue = this.value;

        if (this._previousNativeValue !== newValue) {
            this._previousNativeValue = newValue;
            this._stateChanges.next();
        }
    }

    private _focusSearchboxOrResultsElement(focus = true) {
        if (!this.isSearchboxHidden) {
            setTimeout(() => {
                if (this.searchInput && this.searchInput.nativeElement && focus) {
                    this.searchInput.nativeElement.focus();
                }
            });
        } else if (this.resultsElement) {
            this.resultsElement.focus();
        }
    }

    private _focus(state: boolean) {
        if (!state && this.focused) {
            this.focused = state;
            this.blur.emit(this);
        } else if (state && !this.focused) {
            this.focused = state;
            this.focus.emit(this);
        }
    }

    private _isAbobeOverlay(): boolean {
        return this.overlay && this._overlayPosition && this.listPosition === 'auto'
            ? this._overlayPosition === 'top'
            : this.listPosition === 'above';
    }
}
