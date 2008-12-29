class Province < CouchRest::Model
  key_accessor :kingdom_id
  view_by :kingdom_id
    
  view_by :owners,
    :map => "function(doc){
      if(doc['couchrest-type'] == 'Province'){
        emit([null, doc.kingdom_id, doc._id], null);
      } else if(doc['couchrest-type'] == 'Kingdom'){
        emit([doc.user_id, doc._id], null);
      } else if(doc['couchrest-type'] == 'User'){
        emit([doc._id], null);
      }
      
    }"
end