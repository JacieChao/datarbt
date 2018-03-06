/**
 * Created by JUHCH-PC on 2016/10/12.
 */
function getParameter(name)
{
    var parameter = window.location.search.substr(1);
    var reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)", "i");
    var r = parameter.match(reg);
    if (r != null)
    {
        return decodeURI(r[2]);
    }
    else
    {
        return null;
    }
}