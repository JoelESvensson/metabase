(ns metabase.query-processor.middleware.limit
  "Middleware that handles limiting the maximum number of rows returned by a query."
  (:require [metabase.mbql.util :as mbql.u]
            [metabase.query-processor.interface :as i]
            [metabase.query-processor.util :as qputil]))

(defn- default-limit [query]
  (or (mbql.u/query->max-rows-limit query)
      i/absolute-max-results))

(defn add-default-limit
  "Pre-processing middleware. Add an implicit `limit` clause to MBQL queries without any aggregations."
  ([query]
   (add-default-limit query (default-limit query)))

  ([{query-type :type, :as query} max-rows]
   (cond-> query
     (and (= query-type :query)
          (qputil/query-without-aggregations-or-limits? query))
     (update :query assoc :limit max-rows, ::original-limit (get-in query [:query :limit])))))

(defn limit-result-rows
  "Post-processing middleware. Limit the maximum number of rows that can be taken from the results."
  [query rff]
  (let [limit (default-limit query)]
    (fn limit-rff [metadata]
      (let [rf (rff metadata)]
        ((take limit) rf)))))
