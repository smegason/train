<?php
function fullescape($in)
{
  $out = '';
  for ($i=0;$i<strlen($in);$i++)
  {
    $hex = dechex(ord($in[$i]));
    if ($hex=='')
       $out = $out.urlencode($in[$i]);
    else
       $out = $out .'%'.((strlen($hex)==1) ? ('0'.strtoupper($hex)):(strtoupper($hex)));
  }
  $out = str_replace('+','%20',$out);
  $out = str_replace('_','%5F',$out);
  $out = str_replace('.','%2E',$out);
  $out = str_replace('-','%2D',$out);
  return $out;
}
?> 