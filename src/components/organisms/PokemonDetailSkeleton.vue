<template>
  <v-row>
    <v-col cols="12" md="5">
      <v-skeleton-loader type="image, article" />
    </v-col>
    <v-col cols="12" md="7" class="d-flex flex-column ga-4">
      <v-skeleton-loader type="article" />
      <v-skeleton-loader type="list-item-two-line@3" />
    </v-col>
    <v-col cols="12">
      <v-skeleton-loader type="article" />
    </v-col>
  </v-row>
</template>
