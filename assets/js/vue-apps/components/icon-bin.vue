<template functional>
    <svg
        role="img"
        class="icon icon--bin"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 16 16"
        width="14"
        height="14"
        :aria-hidden="true"
        :aria-labelledby="'aria-bin-title-' + props.id"
        :aria-describedby="'aria-bin-desc-' + props.id"
    >
        <title :id="'aria-bin-title-' + props.id">Bin icon</title>
        <desc :id="'aria-bin-desc-' + props.id">{{ props.description }}</desc>
        <path
            d="M3 16h10l1-11h-12zM10 2v-2h-4v2h-5v3l1-1h12l1 1v-3h-5zM9 2h-2v-1h2v1z"
        ></path>
    </svg>
</template>
