
var MergeSort = function ()
{
    var that = this;

    this.msort = function (array, begin, end, func)
    {
        var size= end - begin;
        if (size < 2) return;

        var begin_right = begin + Math.floor(size / 2);

        that.msort(array, begin, begin_right, func);
        that.msort(array, begin_right, end, func);
        that.merge(array, begin, begin_right, end, func);
    };


    this.merge = function(array, begin, begin_right, end, func)
    {
        for ( ; begin < begin_right ; ++begin)
        {
            if (func(array[begin], array[begin_right]))
            {
                var v = array[begin];
                array[begin] = array[begin_right];
                that.insert(array, begin_right, end, v, func);
            }
        }
    };


    this.insert = function(array, begin, end, v, func)
    {
        while(begin + 1 < end && func(v, array[begin + 1]))
        {
            // Swap two elements
            var tmp = array[begin];
            array[begin] = array[begin + 1];
            array[begin + 1] = tmp;
            begin++;
        }
        array[begin] = v;
    };
};




MergeSort.sortArray = function(array, func)
{
    var sorter = new MergeSort();
    sorter.msort(array, 0, array.length, func);
};




MergeSort.sortOptionCollection = function(optCollection, func)
{
    var array = [];

    for (var i = 0 ; i < optCollection.length ; i ++)
        array[i] = optCollection[i];

    var sorter = new MergeSort();
    sorter.msort(array, 0, array.length, func);

    for (var i = 0 ; i < array.length ; i ++)
        optCollection[i] = array[i];
};




Object.size = function(obj) {
    var size = 0, key;
    for (key in obj) {
        if (obj.hasOwnProperty(key)) size++;
    }
    return size;
};
