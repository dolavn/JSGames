curr_list = []

exports.addToList = function(url){
    curr_list.push(url);
    console.log(curr_list);
    return curr_list
};