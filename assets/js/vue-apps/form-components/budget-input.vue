<script>
import sumBy from 'lodash/sumBy';
import concat from 'lodash/concat';
import IconBin from '../components/icon-bin.vue';

import { trackEvent, tagHotjarRecording } from '../../helpers/metrics';

export default {
    components: { IconBin },
    props: {
        fieldName: { type: String, required: true },
        maxBudget: { type: Number, required: true },
        maxItems: { type: Number, required: true },
        formShortId: { type: String, default: null },
        budgetData: {
            type: Array,
            default() {
                return [];
            },
        },
    },
    data() {
        // Add a ready-to-use new row if the budget isn't over the limit already
        const initialBudgetRows = this.shouldAddNewRow(this.budgetData)
            ? concat(this.budgetData, [{ item: '', cost: '' }])
            : this.budgetData;
        return {
            budgetRows: initialBudgetRows,
            error: {
                TOO_MANY_ITEMS: initialBudgetRows.length === this.maxItems,
                OVER_BUDGET: this.maxBudget && this.total > this.maxBudget,
            },
        };
    },
    mounted() {
        this.checkErrors();
    },
    computed: {
        total() {
            return sumBy(this.budgetRows, (row) => parseInt(row.cost || 0));
        },
    },
    watch: {
        budgetRows: {
            handler() {
                if (this.shouldAddNewRow(this.budgetRows)) {
                    this.addRow();
                }
                this.checkErrors();
            },
            deep: true,
        },
    },
    methods: {
        checkErrors() {
            this.error.TOO_MANY_ITEMS =
                this.budgetRows.length === this.maxItems;
            this.error.OVER_BUDGET =
                this.maxBudget && this.total > this.maxBudget;

            if (this.error.OVER_BUDGET) {
                trackEvent('Budget Component', 'Error', 'Over budget');
            }

            if (this.error.TOO_MANY_ITEMS) {
                trackEvent(
                    'Budget Component',
                    'Error',
                    'Maximum number of items reached'
                );
            }
        },
        getLineItemName(index, subFieldName) {
            return `${this.fieldName}[${index}][${subFieldName}]`;
        },
        shouldAddNewRow(budgetData) {
            if (!budgetData || budgetData.length >= this.maxItems) {
                return false;
            }
            const lastItem = budgetData[budgetData.length - 1];
            return !(lastItem && !lastItem.item && !lastItem.cost);
        },
        addRow() {
            if (this.budgetRows.length < this.maxItems) {
                this.budgetRows.push({ item: '', cost: '' });
            }
        },
        removeItem(item) {
            tagHotjarRecording([
                `Apply: ${this.formShortId}: Budget: Row deleted`,
            ]);
            this.budgetRows = this.budgetRows.filter((i) => i !== item);
        },
        canDelete(index) {
            return (
                this.budgetRows.length > 1 &&
                index !== this.budgetRows.length - 1
            );
        },
        onlyNumber($event) {
            const keyCode = $event.keyCode ? $event.keyCode : $event.which;
            const bannedKeys = [46, 44, 45]; // comma, period, dash
            const isBannedKey = bannedKeys.indexOf(keyCode) !== -1;
            if (isBannedKey) {
                $event.preventDefault();
            }
        },
    },
};
</script>

<!-- If we update this we should change the Nunjucks component too -->
<template>
    <div class="ff-budget">
        <ol class="ff-budget__list">
            <li
                class="ff-budget__row"
                v-for="(lineItem, index) in budgetRows"
                :key="index"
                data-testid="budget-row"
            >
                <div class="ff-budget__row-item">
                    <label
                        class="ff-label"
                        :for="getLineItemName(index, 'item')"
                        v-html="$t('budget.item')"
                    >
                    </label>
                    <input
                        class="ff-text u-block-full"
                        type="text"
                        :name="getLineItemName(index, 'item')"
                        :id="getLineItemName(index, 'item')"
                        autocomplete="off"
                        :placeholder="$t('budget.itemPlaceholder')"
                        v-model="lineItem.item"
                    />
                </div>
                <div class="ff-budget__row-amount">
                    <label
                        class="ff-label"
                        :for="getLineItemName(index, 'cost')"
                        v-html="$t('budget.amount')"
                    >
                    </label>
                    <div class="ff-currency ff-currency--row">
                        <div class="ff-currency__pre">£</div>
                        <input
                            type="number"
                            :name="getLineItemName(index, 'cost')"
                            :id="getLineItemName(index, 'cost')"
                            v-model.number="lineItem.cost"
                            :placeholder="$t('budget.amountPlaceholder')"
                            min="1"
                            step="1"
                            :max="maxBudget"
                            class="ff-currency__input"
                            @keypress="onlyNumber($event)"
                        />
                    </div>
                </div>
                <div class="ff-budget-row__action">
                    <button
                        class="btn btn--small btn--outline"
                        type="button"
                        @click="removeItem(lineItem)"
                        v-if="canDelete(index)"
                    >
                        <span class="btn__icon btn__icon-left">
                            <IconBin
                                :id="'delete-icon-' + index"
                                :description="$t('budget.deleteThisRow')"
                            />
                        </span>
                        {{ $t('budget.deleteRow') }}
                        <span class="u-visually-hidden">
                            "{{ lineItem.item }}" (row {{ index + 1 }})
                        </span>
                    </button>
                </div>
            </li>
        </ol>

        <div
            class="ff-budget__errors"
            aria-live="polite"
            aria-atomic="true"
            data-testid="budget-errors"
        >
            <p v-if="error.TOO_MANY_ITEMS">
                {{ $t('budget.tooManyItems') }} {{ maxItems }}
            </p>
            <p v-if="error.OVER_BUDGET">
                {{ $t('budget.overBudget') }} £{{ maxBudget.toLocaleString() }}.
            </p>
        </div>

        <dl
            class="ff-budget__total"
            aria-live="polite"
            aria-atomic="true"
            data-testid="budget-total"
        >
            <dt class="ff-budget__total-label" v-html="$t('budget.total')"></dt>
            <dd class="ff-budget__total-amount">
                £{{ total.toLocaleString() }}
            </dd>
        </dl>
    </div>
</template>
